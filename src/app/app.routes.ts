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
        path: 'scan',
        loadComponent: () =>
          import('./components/scan-resume/scan-resume').then((m) => m.ScanResume),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./components/create-resume/create-resume').then((m) => m.CreateResume),
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
        path: 'match-results',
        loadComponent: () =>
          import('./components/match-results/match-results').then((m) => m.MatchResults),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./components/resume-history/resume-history').then((m) => m.ResumeHistory),
      },
      {
        path: 'features',
        loadComponent: () =>
          import('./components/footer/features/features').then((m) => m.Features),
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./components/footer/about/about').then((m) => m.About),
      },
      {
        path: 'help-center',
        loadComponent: () =>
          import('./components/footer/help-center/help-center').then((m) => m.HelpCenter),
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./components/footer/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
      },
      {
        path: 'tutorial',
        loadComponent: () =>
          import('./components/footer/tutorial/tutorial').then((m) => m.Tutorial),
      },
      {
        path: 'terms-of-service',
        loadComponent: () =>
          import('./components/footer/terms-of-service/terms-of-service').then((m) => m.TermsOfService),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./components/footer/contact/contact').then(m => m.Contact),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./components/footer/pricing/pricing').then(m => m.Pricing),
      }
    ],
  },
  { path: '**', redirectTo: 'upload' },
];
