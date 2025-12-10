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

import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  isLoading = this.skeletonService.loading; // re-using your service
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
    // router tracking (safe)
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((ev: any) => {
        this.currentUrl.set(ev.url);
        if (isPlatformBrowser(this.platformId)) {
          // only scroll in browser and when sensible
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
        }
      });

    // Sync GoogleAuth -> UserService once when user appears
    effect(() => {
      const authUser = this.googleAuth.user();
      if (!authUser) {
        // no logged in user: clear server-side user copy
        this.userService.clearUser();
        // make sure skeleton isn't stuck waiting for a user
        if (this.skeletonService.loading()) {
          // short delay so UX doesn't feel abrupt
          setTimeout(() => this.skeletonService.setLoading(false), 250);
        }
        return;
      }

      // if authUser present, fetch current user (one-time)
      this.userService.fetchCurrentUser().pipe(take(1)).subscribe({
        next: () => {
          // stop skeleton when user data arrives
          if (this.skeletonService.loading()) {
            setTimeout(() => this.skeletonService.setLoading(false), 300);
          }
        },
        error: () => {
          // failed to fetch — log out auth to keep app consistent
          this.googleAuth.logout();
          if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
        }
      });
    });

    // Ensure skeleton eventually stops even if something goes wrong
    // (fallback safety in case of network/3rd-party failures)
    setTimeout(() => {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }, 10_000); // 10s safety net
  }

  ngOnInit() {
    this.checkScreenSize();

    // load cached user (non-blocking)
    if (isPlatformBrowser(this.platformId)) {
      try { this.googleAuth.loadUserFromStorage(); } catch (e) { /* noop */ }
    }

    // Initialize Google Auth in a non-blocking, resilient way.
    // Works whether initialize() returns a Promise or not.
    try {
      const maybePromise = this.googleAuth.initialize?.(
        '159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com'
      );

      if (maybePromise !== undefined && typeof (maybePromise as any).then === 'function') {
        (maybePromise as Promise<any>)
          .then(() => { /* ok */ })
          .catch(() => {
            // don't block UI — ensure skeleton is turned off if auth fails
            if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
          });
      } else {
        // synchronous initialize completed or not present — nothing to wait for
      }
    } catch (err) {
      // initialization threw synchronously — don't block UI
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }
  }

  ngOnDestroy(): void {
    // cleanup DOM classes safely
    if (isPlatformBrowser(this.platformId)) {
      try { this.renderer.removeClass(document.body, 'mobile-nav-open'); } catch { /* noop */ }
    }
    // teardown observables
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  // ---------------------------------------
  // UI Events (all guarded with isPlatformBrowser)
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
    // keep navigation simple & safe
    try { this.router.navigate([`/${path}`]); } catch { /* noop */ }
  }

  loginWithGoogle() {
    // non-blocking sign-in
    try {
      this.googleAuth.signIn();
    } catch {
      if (this.skeletonService.loading()) this.skeletonService.setLoading(false);
    }
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
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.setItem('activeTab', tab); } catch { /* noop */ }
    }
  }

  scrollToTop() {
    if (!isPlatformBrowser(this.platformId)) return;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
  }

  // NOTE: keep UI visible — don't hide entire app on mobile build route.
  // If you want to hide the sidebar on small screens for /build, handle that in the template.
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
