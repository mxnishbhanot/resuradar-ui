import { Component, HostListener, Renderer2, OnInit, OnDestroy } from '@angular/core';
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

import { signal, computed, effect, Signal } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';

import { GoogleAuthService } from '../../core/services/google-auth';
import { UserService } from '../../core/services/user';
import { SkeletonService } from '../../core/services/skeleton';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';

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
  // Signals for UI state
  isLoading = signal<boolean>(true);
  mobileNavOpen = signal<boolean>(false);
  profileMenuOpen = signal<boolean>(false);
  isMobileView = signal<boolean>(false);
  isIpadView = signal<boolean>(false);
  showBackToTop = signal<boolean>(false);

  // Active tab as a signal
  activeTab = signal<string>('upload');

  // User-related signals
  userFromAuth = signal<any | null>(null);
  user = signal<any | null>(null);
  userName = signal<string>('Guest User');
  userEmail = signal<string>('');
  avatar = signal<string>('');
  isPremium = computed(() => !!this.user()?.isPremium);
  isLoggedIn = computed(() => !!this.userFromAuth());

  // Router URL tracking for shouldRender behaviour
  currentUrl = signal<string>('');

  // Subscriptions to clean up
  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    public googleAuth: GoogleAuthService,
    public dialog: MatDialog,
    private userService: UserService,
    private renderer: Renderer2,
    private skeletonService: SkeletonService,
  ) {
    // Initialize activeTab from localStorage safely inside constructor
    const stored = localStorage.getItem('activeTab');
    this.activeTab.set(stored || 'upload');

    // Initialize currentUrl safely (router is available now)
    this.currentUrl.set(this.router.url);

    // Wire router navigation events (scroll-to-top + url tracking)
    const subRouter = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((ev: any) => {
        this.currentUrl.set(ev?.url || this.router.url);
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    this.subs.push(subRouter);

    // Subscribe to skeletonService.loading$ -> set signal
    const skeletonSub = this.skeletonService.loading$.subscribe(v => this.isLoading.set(!!v));
    this.subs.push(skeletonSub);
  }

  ngOnInit(): void {
    this.checkScreenSize();

    // keep skeleton visible initially (preserve original behavior)
    this.skeletonService.setLoading(true);

    // Initialize Google Auth after the original small delay
    const timeout = setTimeout(() => {
      this.googleAuth.initialize('159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com');
    }, 500);
    // add a pseudo-subscription for cleanup
    this.subs.push({ unsubscribe: () => clearTimeout(timeout) } as unknown as Subscription);

    // Load user from storage
    this.googleAuth.loadUserFromStorage();

    // Subscribe to googleAuth.user$ and fetch current user if present
    const authSub = this.googleAuth.user$
      .pipe(
        switchMap(u => {
          if (!u) {
            this.userFromAuth.set(null);
            this.userName.set('Guest User');
            this.userEmail.set('');
            this.avatar.set('');
            return of(null);
          }

          this.userFromAuth.set(u);
          this.userName.set(u.name || 'Guest User');
          this.userEmail.set(u.email || '');
          this.avatar.set(u.picture || '');

          return this.userService.fetchCurrentUser()
            .pipe(catchError(err => {
              console.error('Error fetching user:', err);
              this.googleAuth.logout();
              return of(null);
            }));
        })
      )
      .subscribe(() => {
        this.stopLoadingWithDelay();
      });
    this.subs.push(authSub);

    // Mirror userService.user$ into the user signal
    const userServiceSub = this.userService.user$.subscribe(u => this.user.set(u));
    this.subs.push(userServiceSub);
  }

  ngOnDestroy(): void {
    // unsubscribe all subscriptions
    this.subs.forEach(s => {
      try { s.unsubscribe(); } catch { /* noop */ }
    });

    if (this.mobileNavOpen()) {
      this.renderer.removeClass(document.body, 'mobile-nav-open');
    }
    this.profileMenuOpen.set(false);
    this.renderer.removeClass(document.body, 'loading-active');
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.checkScreenSize();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showBackToTop.set(window.scrollY > 300);
  }

  // UI helpers
  private stopLoadingWithDelay(): void {
    setTimeout(() => {
      this.skeletonService.setLoading(false);
    }, 800);
  }

  checkScreenSize(): void {
    const w = window.innerWidth;
    this.isMobileView.set(w <= 768);
    this.isIpadView.set(w <= 820);

    if (!this.isMobileView() && this.mobileNavOpen()) {
      this.closeMobileNav();
    }

    if (this.isMobileView() && this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  toggleMobileNav(): void {
    const next = !this.mobileNavOpen();
    this.mobileNavOpen.set(next);

    if (next && this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }

    if (next) {
      this.renderer.addClass(document.body, 'mobile-nav-open');
    } else {
      this.renderer.removeClass(document.body, 'mobile-nav-open');
    }
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
    this.renderer.removeClass(document.body, 'mobile-nav-open');
  }

  toggleProfileMenu(): void {
    const next = !this.profileMenuOpen();
    this.profileMenuOpen.set(next);

    if (next && this.mobileNavOpen()) {
      this.closeMobileNav();
    }
  }

  navigate(path: string): void {
    this.router.navigate([`/${path}`]);
  }

  loginWithGoogle(): void {
    this.googleAuth.signIn();
  }

  openUpgradeModal(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'responsive-dialog-wrapper';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.width = '100%';
    dialogConfig.height = '100%';
    dialogConfig.disableClose = true;

    this.dialog.open(UpgradePro, dialogConfig);
  }

  exteranlLink(type: string): void {
    if (type === 'site') {
      window.open('https://resuradar.in', '_blank');
    } else if (type === 'linkedin') {
      window.open('https://www.linkedin.com/in/manish-kumar-031124226/', '_blank');
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    localStorage.setItem('activeTab', tab);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  shouldRender(): boolean {
    const url = this.currentUrl();
    return !(url.includes('/build') && window.innerWidth < 1024);
  }
}
