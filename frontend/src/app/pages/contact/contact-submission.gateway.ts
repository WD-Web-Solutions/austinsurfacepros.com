import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactFormPayload {
  name: string;
  emailAddress: string;
  company?: string;
  phone?: string;
  service: string;
  message: string;
}

export interface ContactResponse {
  message: string;
}

export interface ContactSubmissionGateway {
  submit(payload: ContactFormPayload): Observable<ContactResponse>;
}

export const CONTACT_SUBMISSION_GATEWAY =
  new InjectionToken<ContactSubmissionGateway>('CONTACT_SUBMISSION_GATEWAY');
