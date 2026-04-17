import {
  Component,
  HostListener,
  Renderer2,
  effect,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
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
import { CustomResumesListRefetchService } from '../../core/services/custom-resumes-list-refetch.service';
import { SkeletonService } from '../../core/services/skeleton';
import { SkeletonLoader } from '../../shared/components/skeleton-loader/skeleton-loader';
import { filter, take } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatRippleModule,
    SkeletonLoader,
    RouterOutlet,
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit, OnDestroy {
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private dialog = inject(MatDialog);
  public googleAuth = inject(GoogleAuthService);
  private userService = inject(UserService);
  private skeletonService = inject(SkeletonService);
  /** Eagerly construct so My Resumes can detect re-entry from other routes. */
  private _customResumesListRefetch = inject(CustomResumesListRefetchService);
  private platformId = inject(PLATFORM_ID);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private destroyed$ = new Subject<void>();

  isLoading = this.skeletonService.loading;
  mobileNavOpen = signal(false);
  profileMenuOpen = signal(false);
  isMobileView = signal(false);
  isIpadView = signal(false);
  showBackToTop = signal(false);
  activeTab = signal<string>('upload');
  currentUrl = signal('');

  user = this.userService.user;
  userName = computed(() => this.user()?.name ?? 'Guest User');
  userEmail = computed(() => this.user()?.email ?? '');
  avatar = computed(() => this.user()?.picture ?? '');
  isPremium = computed(() => !!this.user()?.isPremium);
  isLoggedIn = computed(() => !!this.googleAuth.user());

  constructor() {
    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem('activeTab');
        if (stored) this.activeTab.set(stored);
      } catch {}
    }

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((ev: any) => {
        this.currentUrl.set(ev.url);
        if (this.isBrowser()) {
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
        }
      });

    if (!isPlatformBrowser(this.platformId)) return;

    effect(() => {
      const authUser = this.googleAuth.user();
      if (!authUser) {
        this.userService.clearUser();
        if (this.skeletonService.loading()) {
          setTimeout(() => this.skeletonService.setLoading(false), 250);
        }
        return;
      }

      this.userService.fetchCurrentUser().pipe(take(1)).subscribe({
        next: () => {
          if (this.skeletonService.loading()) {
            setTimeout(() => this.skeletonService.setLoading(false), 300);
          }
        },
        error: () => {
          this.googleAuth.logout();
          if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
        }
      });
    });

    setTimeout(() => {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }, 10_000);
  }

  async ngOnInit() {
    this.checkScreenSize();

    if (this.isBrowser()) {
      try {
        this.googleAuth.loadUserFromStorage();
        await this.googleAuth.bootstrapSession();
      } catch {}

      try {
        await this.googleAuth.initialize(
          '159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com'
        );
      } catch (err) {
        console.error('[Home] google initialize failed', err);
        if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
      }
    }

    setTimeout(() => {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }, 10_000);
  }

  ngOnDestroy(): void {
    if (this.isBrowser()) {
      try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch {}
    }
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser()) return;
    this.checkScreenSize();
  }

  @HostListener('window:scroll')
  onScroll() {
    if (!this.isBrowser()) return;
    try { this.showBackToTop.set(window.scrollY > 300); } catch {}
  }

  checkScreenSize() {
    if (!this.isBrowser()) {
      this.isMobileView.set(false);
      this.isIpadView.set(false);
      return;
    }

    const w = window.innerWidth;
    this.isMobileView.set(w <= 768);
    this.isIpadView.set(w <= 820);

    if (!this.isMobileView() && this.mobileNavOpen()) this.closeMobileNav();
    if (this.isMobileView() && this.profileMenuOpen()) this.profileMenuOpen.set(false);
  }

  toggleMobileNav() {
    const next = !this.mobileNavOpen();
    this.mobileNavOpen.set(next);

    if (!this.isBrowser()) return;
    if (next) {
      try { this.renderer.addClass(document.body, 'mobile-nav-open'); } catch {}
      this.profileMenuOpen.set(false);
    } else {
      try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch {}
    }
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
    if (!this.isBrowser()) return;
    try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch {}
  }

  toggleProfileMenu() {
    const next = !this.profileMenuOpen();
    this.profileMenuOpen.set(next);
    if (next) this.closeMobileNav();
  }

  navigate(path: string) {
    try { this.router.navigate([`/${path}`]); } catch {}
  }

  loginWithGoogle() {
    try {
      this.googleAuth.signIn();
    } catch {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }
  }

  async openUpgradeModal() {
    const { UpgradePro } = await import('../../components/upgrade-pro/upgrade-pro');

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
    if (this.isBrowser()) {
      try { localStorage.setItem('activeTab', tab); } catch {}
    }
  }

  scrollToTop() {
    if (!this.isBrowser()) return;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }

  shouldRender() {
    return true;
  }

  externalLink(url: 'site' | 'linkedin') {
    if (!this.isBrowser()) return;
    const urls = {
      site: 'https://resuradar.in',
      // Company page — update slug if your official LinkedIn differs
      linkedin: 'https://www.linkedin.com/company/resuradar/',
    };
    try { window.open(urls[url], '_blank'); } catch {}
  }
}
