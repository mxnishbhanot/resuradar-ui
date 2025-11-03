import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.Home), // 👈 Home acts as layout wrapper
    children: [
      { path: '', redirectTo: 'upload', pathMatch: 'full' },

      {
        path: 'upload',
        loadComponent: () =>
          import('./components/upload-resume/upload-resume').then((m) => m.UploadResume),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'analysis',
        loadComponent: () =>
          import('./components/analysis-result/analysis-result').then((m) => m.AnalysisResult),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./components/resume-history/resume-history').then((m) => m.ResumeHistory),
      },
      {
        path: 'features',
        loadComponent: () =>
          import('./components/features/features').then((m) => m.Features),
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./components/about/about').then((m) => m.About),
      },
      {
        path: 'help-center',
        loadComponent: () =>
          import('./components/help-center/help-center').then((m) => m.HelpCenter),
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./components/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
      },
    ],
  },
  { path: '**', redirectTo: 'upload' },
];
