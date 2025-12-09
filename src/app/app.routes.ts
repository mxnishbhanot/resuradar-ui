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
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'build',
        loadComponent: () =>
          import('./resume-builder/builder/builder.component').then((m) => m.ResumeBuilderComponent),
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
      },
      {
        path: 'start',
        loadComponent: () =>
          import('./resume-builder/start-resume/start-resume').then(m => m.StartResumeComponent),
      },
      {
        path: 'custom-list',
        loadComponent: () =>
          import('./components/custom-resumes/custom-resumes').then(m => m.CustomResumesComponent),
      }

    ],
  },
  { path: '**', redirectTo: 'upload' },
];
