import { Component, HostListener, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { MatTooltipModule } from "@angular/material/tooltip";
import { GoogleAuthService } from '../../core/services/google-auth';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserService } from '../../core/services/user';
import { ScAngularLoader } from 'sc-angular-loader';
import { MatRippleModule } from '@angular/material/core';
import { filter } from 'rxjs';

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
    ScAngularLoader,
    MatRippleModule,
    RouterModule
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

  constructor(
    private router: Router,
    public googleAuth: GoogleAuthService,
    public dialog: MatDialog,
    private userService: UserService,
    private renderer: Renderer2
  ) { }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit() {
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
        this.userService.fetchCurrentUser().subscribe();
      } else {
        this.userName = 'Guest User';
        this.userEmail = '';
        this.avatar = '';
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

  ngOnDestroy() {
    // Remove body class if component is destroyed with nav open
    if (this.mobileNavOpen) {
      this.renderer.removeClass(document.body, 'mobile-nav-open');
    }

    // Close profile menu if open
    if (this.profileMenuOpen) {
      this.profileMenuOpen = false;
    }
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 768;
    this.isIpadView = window.innerWidth <= 820;

    // Close mobile nav if screen becomes desktop
    if (!this.isMobileView && this.mobileNavOpen) {
      this.closeMobileNav();
    }

    // Close profile menu on mobile
    if (this.isMobileView && this.profileMenuOpen) {
      this.profileMenuOpen = false;
    }
  }

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;

    // Close profile menu if mobile nav opens
    if (this.mobileNavOpen && this.profileMenuOpen) {
      this.profileMenuOpen = false;
    }

    // Prevent body scroll when mobile nav is open
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

    // Close mobile nav if profile menu opens
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

  // openUpgradeModal() {
  //   this.dialog.open(UpgradePro, {
  //     width: '100%',
  //     maxWidth: '520px',
  //     maxHeight: '90vh',
  //     panelClass: 'upgrade-pro-dialog',
  //     hasBackdrop: true,
  //     disableClose: false,
  //   });
  // }
openUpgradeModal(): void {
  const dialogConfig: MatDialogConfig = {
    width: '100%',
    // Desktop: Fixed height, mobile: Full height
    height: 'auto',
    panelClass: 'upgrade-modal-container',
    autoFocus: false,
    restoreFocus: true,
    disableClose: false, // Allow closing by clicking outside
    hasBackdrop: true,
    backdropClass: 'upgrade-modal-backdrop',
    data: {
      userName: 'John Doe',
      userEmail: 'john@example.com'
    },
    // Smooth entrance animation
    enterAnimationDuration: '300ms',
    exitAnimationDuration: '250ms',

    // Desktop-specific settings
    maxWidth: window.innerWidth > 768 ? '500px' : '90vw',
    maxHeight: window.innerWidth > 768 ? 'fit-content' : '90vh',
  };

  const dialogRef = this.dialog.open(UpgradePro, dialogConfig);

  // Handle modal close
  dialogRef.afterClosed().subscribe(result => {
    console.log('Modal closed with result:', result);
    // Handle any post-close logic
  });
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
}
