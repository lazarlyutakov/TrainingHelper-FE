import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const canonicalOrigin = 'https://training-helper.onrender.com';

if (environment.production && window.location.origin === 'https://traininghelper-fe.onrender.com') {
  // Keep path, query string, and hash while enforcing a single public host.
  window.location.replace(`${canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));

