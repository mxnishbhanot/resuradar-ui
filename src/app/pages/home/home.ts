// home.component.ts - Updated with skeleton loading
import { Component, HostListener, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterOutlet, RouterModule, NavigationEnd, ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import { MatTooltipModule } from "@angular/material/tooltip";
import { GoogleAuthService } from '../../core/services/google-auth';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserService } from '../../core/services/user';
import { MatRippleModule } from '@angular/material/core';
import { filter } from 'rxjs';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader';
import { SkeletonService } from '../../core/services/skeleton';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container';

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
    RouterOutlet,
    MatTooltipModule,
    MatRippleModule,
    RouterModule,
    SkeletonLoaderComponent,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  userName = 'Guest User';
  userEmail = '';
  avatar = '';
  activeTab = 'upload';
  user: any;

  // Mobile nav state
  mobileNavOpen = false;
  profileMenuOpen = false;
  isMobileView = false;
  isIpadView = false;
  showBackToTop = false;

  // Loading state
  isLoading = true;

  constructor(
    private router: Router,
    public googleAuth: GoogleAuthService,
    public dialog: MatDialog,
    private userService: UserService,
    private renderer: Renderer2,
    private skeletonService: SkeletonService,
  ) { }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  ngOnInit() {
    // Subscribe to loading state
    this.skeletonService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Initialize with loading
    this.skeletonService.setLoading(true);

    // Initialize Google Auth
    setTimeout(() => {
      this.googleAuth.initialize('159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com');
    }, 500);

    // Load user from storage
    this.googleAuth.loadUserFromStorage();

    // Subscribe to user changes
    this.googleAuth.user$.subscribe((u) => {
      if (u) {
        this.userName = u.name || 'Guest User';
        this.userEmail = u.email || '';
        this.avatar = u.picture || '';
        this.userService.fetchCurrentUser().subscribe(() => {
          // Stop loading after user data is fetched
          this.stopLoadingWithDelay();
        });
      } else {
        this.userName = 'Guest User';
        this.userEmail = '';
        this.avatar = '';
        // Stop loading even if no user
        this.stopLoadingWithDelay();
      }
    });

    // Subscribe to user service
    this.userService.user$.subscribe(user => {
      this.user = user;
    });

    // Scroll to top on route change
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });

    // Load active tab from localStorage
    this.activeTab = localStorage.getItem('activeTab') || 'upload';

    // Check screen size
    this.checkScreenSize();
  }

  private stopLoadingWithDelay() {
    // Minimum display time for skeleton to avoid flash
    setTimeout(() => {
      this.skeletonService.setLoading(false);
    }, 800);
  }

  ngOnDestroy() {
    if (this.mobileNavOpen) {
      this.renderer.removeClass(document.body, 'mobile-nav-open');
    }

    if (this.profileMenuOpen) {
      this.profileMenuOpen = false;
    }

    // Clean up any loading-related classes
    this.renderer.removeClass(document.body, 'loading-active');
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 768;
    this.isIpadView = window.innerWidth <= 820;

    if (!this.isMobileView && this.mobileNavOpen) {
      this.closeMobileNav();
    }

    if (this.isMobileView && this.profileMenuOpen) {
      this.profileMenuOpen = false;
    }
  }

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;

    if (this.mobileNavOpen && this.profileMenuOpen) {
      this.profileMenuOpen = false;
    }

    if (this.mobileNavOpen) {
      this.renderer.addClass(document.body, 'mobile-nav-open');
    } else {
      this.renderer.removeClass(document.body, 'mobile-nav-open');
    }
  }

  closeMobileNav() {
    this.mobileNavOpen = false;
    this.renderer.removeClass(document.body, 'mobile-nav-open');
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;

    if (this.profileMenuOpen && this.mobileNavOpen) {
      this.closeMobileNav();
    }
  }

  navigate(path: string) {
    this.router.navigate([`/${path}`]);
  }

  loginWithGoogle() {
    this.googleAuth.signIn();
  }

  openUpgradeModal() {
    const dialogConfig = new MatDialogConfig();

    // This connects to the global CSS above
    dialogConfig.panelClass = 'responsive-dialog-wrapper';

    dialogConfig.maxWidth = '100vw';
    dialogConfig.width = '100%';
    dialogConfig.height = '100%';
    dialogConfig.disableClose = true; // We handle closing manually

    this.dialog.open(UpgradePro, dialogConfig);
  }

  exteranlLink(type: string) {
    if (type === 'site') {
      window.open('https://resuradar.in', '_blank');
    } else if (type === 'linkedin') {
      window.open('https://www.linkedin.com/in/manish-kumar-031124226/', '_blank');
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    localStorage.setItem('activeTab', tab);
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  shouldRender(): boolean {
    const url = this.router.url;
    return !(url.includes('/build') && window.innerWidth < 1024);
  }
}
