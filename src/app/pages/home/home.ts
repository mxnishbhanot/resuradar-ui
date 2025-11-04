import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterOutlet, RouterLinkWithHref, RouterModule, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatTooltipModule } from "@angular/material/tooltip";
import { GoogleAuthService } from '../../core/services/google-auth';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../core/services/user';
import { ScAngularLoader } from 'sc-angular-loader';
import { MatRippleModule } from '@angular/material/core'
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
    MatBadgeModule,
    MatDividerModule,
    MatCardModule,
    RouterOutlet,
    MatTooltipModule,
    ScAngularLoader,
    MatRippleModule,
    RouterLinkWithHref,
    RouterModule
],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  analysisData: any = null;
  userName = 'Sarah Johnson';
  userInitials = 'SJ';
  avatar = 'https://i.pravatar.cc/150?img=12';
  userResumeCount = 3;
  userScore = 7.2;
  activeTab = 'upload';
  user: any;

  constructor(
    private router: Router,
    public googleAuth: GoogleAuthService,
    public dialog: MatDialog,
    private userService: UserService,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.googleAuth.initialize('159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com');
    }, 500);

    this.googleAuth.loadUserFromStorage();
    this.googleAuth.user$.subscribe((u) => {
      this.userName = u ? u.name : 'Guest';
      this.avatar = u ? u.picture : 'https://i.pravatar.cc/150?img=12';

      if (u) {
        this.userService.fetchCurrentUser().subscribe();
      }
    });

    this.userService.user$.subscribe(user => {
      console.log(user);
      this.user = user;
      this.user = user;
    });

     this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });

      localStorage.getItem('activeTab') ? this.activeTab = localStorage.getItem('activeTab')! : this.activeTab = 'upload';
  }


  navigate(navigateTo: string) {
    this.router.navigate([`/${navigateTo}`]);
  }

  loginWithGoogle() {
    this.googleAuth.signIn();
  }

  openUpgradeModal() {
    this.dialog.open(UpgradePro, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'upgrade-pro-dialog'
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
