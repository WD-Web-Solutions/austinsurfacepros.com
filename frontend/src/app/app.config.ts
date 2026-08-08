import { ApplicationConfig } from '@angular/core';

import { provideHttpClient, withFetch } from '@angular/common/http';

import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { CONTACT_SUBMISSION_GATEWAY } from './pages/contact/contact-submission.gateway';
import { DemoContactSubmissionGateway } from './pages/contact/demo-contact-submission.gateway';
import { HttpContactSubmissionGateway } from './pages/contact/http-contact-submission.gateway';


export const appConfig: ApplicationConfig = {

  providers: [

    provideHttpClient(withFetch()),

    provideRouter(routes),

    {
      provide: CONTACT_SUBMISSION_GATEWAY,
      useClass: environment.demoMode
        ? DemoContactSubmissionGateway
        : HttpContactSubmissionGateway
    }

  ]

};
