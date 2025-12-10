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

import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
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
import { SkeletonLoader } from '../../shared/components/skeleton-loader/skeleton-loader';

import { filter, take } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
    SkeletonLoader,
    NgOptimizedImage
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit, OnDestroy {

  // injectables
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private dialog = inject(MatDialog);
  public googleAuth = inject(GoogleAuthService);
  private userService = inject(UserService);
  private skeletonService = inject(SkeletonService);
  private platformId = inject(PLATFORM_ID);

  // teardown
  private destroyed$ = new Subject<void>();

  // UI Signals
  isLoading = this.skeletonService.loading;
  mobileNavOpen = signal(false);
  profileMenuOpen = signal(false);
  isMobileView = signal(false);
  isIpadView = signal(false);
  showBackToTop = signal(false);

  // Tabs
  activeTab = signal(
    (isPlatformBrowser(this.platformId) && localStorage.getItem('activeTab')) || 'upload'
  );

  // URL
  currentUrl = signal('');

  // User State
  user = this.userService.user;
  userName = computed(() => this.user()?.name ?? 'Guest User');
  userEmail = computed(() => this.user()?.email ?? '');
  avatar = computed(() => this.user()?.picture ?? '');
  isPremium = computed(() => !!this.user()?.isPremium);
  isLoggedIn = computed(() => !!this.googleAuth.user());

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((ev: any) => {
        this.currentUrl.set(ev.url);
        if (isPlatformBrowser(this.platformId)) {
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
        }
      });

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

  ngOnInit() {
    this.checkScreenSize();

    if (isPlatformBrowser(this.platformId)) {
      try { this.googleAuth.loadUserFromStorage(); } catch (e) { /* noop */ }
    }

    try {
      const maybePromise = this.googleAuth.initialize?.(
        '159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com'
      );

      if (maybePromise !== undefined && typeof (maybePromise as any).then === 'function') {
        (maybePromise as Promise<any>)
          .then(() => { /* ok */ })
          .catch(() => {
            if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
          });
      }
    } catch (err) {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch { /* noop */ }
    }
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  // ---------------------------------------
  // UI Events
  // ---------------------------------------

  @HostListener('window:resize')
  onResize() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.checkScreenSize();
  }

  @HostListener('window:scroll')
  onScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    try { this.showBackToTop.set(window.scrollY > 300); } catch { /* noop */ }
  }

  checkScreenSize() {
    if (!isPlatformBrowser(this.platformId)) {
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

    if (!isPlatformBrowser(this.platformId)) return;
    if (next) {
      try { this.renderer.addClass(document.body, 'mobile-nav-open'); } catch { /* noop */ }
      this.profileMenuOpen.set(false);
    } else {
      try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch { /* noop */ }
    }
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
    if (!isPlatformBrowser(this.platformId)) return;
    try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch { /* noop */ }
  }

  toggleProfileMenu() {
    const next = !this.profileMenuOpen();
    this.profileMenuOpen.set(next);
    if (next) this.closeMobileNav();
  }

  navigate(path: string) {
    try { this.router.navigate([`/${path}`]); } catch { /* noop */ }
  }

  loginWithGoogle() {
    try {
      this.googleAuth.signIn();
    } catch {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }
  }

  // OPTIMIZED: Dynamic import for the Upgrade Modal
  async openUpgradeModal() {
    // Lazy load the component JS chunk only when clicked
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
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.setItem('activeTab', tab); } catch { /* noop */ }
    }
  }

  scrollToTop() {
    if (!isPlatformBrowser(this.platformId)) return;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
  }

  shouldRender() {
    return true;
  }

  externalLink(url: 'site' | 'linkedin') {
    if (!isPlatformBrowser(this.platformId)) return;
    const urls = {
      site: 'https://resuradar.in',
      linkedin: 'https://www.linkedin.com/in/manish-kumar-031124226/',
    };
    try { window.open(urls[url], '_blank'); } catch { /* noop */ }
  }
}
