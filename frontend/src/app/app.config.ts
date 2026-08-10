import { ApplicationConfig } from '@angular/core';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { CONTACT_SUBMISSION_GATEWAY } from './pages/contact/contact-submission.gateway';
import { DemoContactSubmissionGateway } from './pages/contact/demo-contact-submission.gateway';
import { HttpContactSubmissionGateway } from './pages/contact/http-contact-submission.gateway';
import { GALLERY_CONTENT_REPOSITORY } from './core/services/gallery-content.repository';
import { HttpGalleryContentRepository } from './core/services/http-gallery-content.repository';
import { LocalGalleryContentRepository } from './core/services/local-gallery-content.repository';

import { authInterceptor } from './core/interceptors/auth.interceptor';


export const appConfig: ApplicationConfig = {

  providers: [

    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top'
      })
    ),

    {
      provide: CONTACT_SUBMISSION_GATEWAY,
      useClass: environment.demoMode
        ? DemoContactSubmissionGateway
        : HttpContactSubmissionGateway
    },
    {
      provide: GALLERY_CONTENT_REPOSITORY,
      useClass: environment.gallery.useLocalRepository
        ? LocalGalleryContentRepository
        : HttpGalleryContentRepository
    }

  ]

};
