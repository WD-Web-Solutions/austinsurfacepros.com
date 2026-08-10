import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactFormPayload {
  propertyType: string;
  service: string;
  message: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  timeline: string;
  name: string;
  emailAddress?: string;
  company?: string;
  phone?: string;
}

export interface ContactResponse {
  message: string;
}

export interface ContactSubmissionGateway {
  submit(payload: ContactFormPayload): Observable<ContactResponse>;
}

export const CONTACT_SUBMISSION_GATEWAY =
  new InjectionToken<ContactSubmissionGateway>('CONTACT_SUBMISSION_GATEWAY');
