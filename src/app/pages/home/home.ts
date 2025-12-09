import {
  Component,
  HostListener,
  Renderer2,
  effect,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { GoogleAuthService } from '../../core/services/google-auth';
import { UserService } from '../../core/services/user';
import { SkeletonService } from '../../core/services/skeleton';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatRippleModule,
    RouterModule,
    SkeletonLoaderComponent,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit, OnDestroy {

  /** ✅ NEW: DI fields (safe for signals/effects) */
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private dialog = inject(MatDialog);
  public googleAuth = inject(GoogleAuthService);
  private userService = inject(UserService);
  private skeletonService = inject(SkeletonService);

  /** UI Signals */
  isLoading = this.skeletonService.loading;
  mobileNavOpen = signal(false);
  profileMenuOpen = signal(false);
  isMobileView = signal(false);
  isIpadView = signal(false);
  showBackToTop = signal(false);

  /** Tabs */
  activeTab = signal(localStorage.getItem('activeTab') || 'upload');

  /** URL */
  currentUrl = signal('');

  /** User State */
  user = this.userService.user;
  userName = computed(() => this.user()?.name ?? 'Guest User');
  userEmail = computed(() => this.user()?.email ?? '');
  avatar = computed(() => this.user()?.picture ?? '');
  isPremium = computed(() => !!this.user()?.isPremium);
  isLoggedIn = computed(() => !!this.googleAuth.user());

  constructor() {
    /** Router tracking */
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((ev: any) => {
        this.currentUrl.set(ev.url);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

    /** Sync GoogleAuth → UserService */
    effect(() => {
      const authUser = this.googleAuth.user();
      if (!authUser) {
        this.userService.clearUser();
        return;
      }

      this.userService.fetchCurrentUser().subscribe({
        error: () => this.googleAuth.logout()
      });
    });

    /** Stop skeleton after user loads */
    effect(() => {
      if (this.user()) {
        setTimeout(() => this.skeletonService.setLoading(false), 800);
      }
    });
  }

  ngOnInit() {
    this.checkScreenSize();

    // Load stored user
    this.googleAuth.loadUserFromStorage();

    // Initialize Google
    setTimeout(() => {
      this.googleAuth.initialize(
        '159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com'
      );
    }, 500);
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'mobile-nav-open');
  }

  // -------------------------------------------------------------------
  // UI Events
  // -------------------------------------------------------------------

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showBackToTop.set(window.scrollY > 300);
  }

  checkScreenSize() {
    const w = window.innerWidth;
    this.isMobileView.set(w <= 768);
    this.isIpadView.set(w <= 820);

    if (!this.isMobileView() && this.mobileNavOpen()) this.closeMobileNav();
    if (this.isMobileView() && this.profileMenuOpen()) this.profileMenuOpen.set(false);
  }

  toggleMobileNav() {
    const next = !this.mobileNavOpen();
    this.mobileNavOpen.set(next);

    if (next) {
      this.renderer.addClass(document.body, 'mobile-nav-open');
      this.profileMenuOpen.set(false);
    } else {
      this.renderer.removeClass(document.body, 'mobile-nav-open');
    }
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
    this.renderer.removeClass(document.body, 'mobile-nav-open');
  }

  toggleProfileMenu() {
    const next = !this.profileMenuOpen();
    this.profileMenuOpen.set(next);
    if (next) this.closeMobileNav();
  }

  navigate(path: string) {
    this.router.navigate([`/${path}`]);
  }

  loginWithGoogle() {
    this.googleAuth.signIn();
  }

  openUpgradeModal() {
    const cfg = new MatDialogConfig();
    cfg.panelClass = 'responsive-dialog-wrapper';
    cfg.maxWidth = '100vw';
    cfg.width = '100%';
    cfg.height = '100%';
    cfg.disableClose = true;

    this.dialog.open(UpgradePro, cfg);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    localStorage.setItem('activeTab', tab);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  shouldRender() {
    const url = this.currentUrl();
    return !(url.includes('/build') && window.innerWidth < 1024);
  }

  externalLink(url: 'site' | 'linkedin') {
    const urls = {
      site: 'https://resuradar.in',
      linkedin: 'https://www.linkedin.com/in/manish-kumar-031124226/',
    };

    window.open(urls[url], '_blank');
  }

}
