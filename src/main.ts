import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { browserConfig } from './app/app.config.browser';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers!,
    ...browserConfig.providers!
  ]
}).catch(err => console.error(err));
