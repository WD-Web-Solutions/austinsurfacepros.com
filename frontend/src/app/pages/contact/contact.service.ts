import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CONTACT_SUBMISSION_GATEWAY,
  ContactFormPayload,
  ContactResponse,
  ContactSubmissionGateway
} from './contact-submission.gateway';

export type { ContactFormPayload, ContactResponse } from './contact-submission.gateway';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  constructor(
    @Inject(CONTACT_SUBMISSION_GATEWAY)
    private readonly gateway: ContactSubmissionGateway
  ) {}

  submitContactForm(
    payload: ContactFormPayload
  ): Observable<ContactResponse> {
    return this.gateway.submit(payload);
  }
}
