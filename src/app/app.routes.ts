import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Profile } from './components/profile/profile';
import { AnalysisResult } from './components/analysis-result/analysis-result';
import { UploadResume } from './components/upload-resume/upload-resume';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    component: Home,
    children: [
      { path: 'upload', component: UploadResume },
      { path: 'profile', component: Profile },
      { path: 'analysis', component: AnalysisResult },
      { path: '', redirectTo: 'upload', pathMatch: 'full' } // default child route (optional)
    ]
  },
  { path: '**', redirectTo: '/home' }
];
