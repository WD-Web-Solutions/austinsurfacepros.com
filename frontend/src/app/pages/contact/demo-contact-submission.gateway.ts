import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  ContactFormPayload,
  ContactResponse,
  ContactSubmissionGateway
} from './contact-submission.gateway';

@Injectable()
export class DemoContactSubmissionGateway implements ContactSubmissionGateway {
  submit(_payload: ContactFormPayload): Observable<ContactResponse> {
    return of({
      message:
        'Demo only: your request was validated locally and was not sent or saved.'
    });
  }
}
