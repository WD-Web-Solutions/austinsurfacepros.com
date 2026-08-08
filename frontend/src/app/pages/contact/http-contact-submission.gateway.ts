import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ContactFormPayload,
  ContactResponse,
  ContactSubmissionGateway
} from './contact-submission.gateway';

interface ContactApiResponse {
  id: string;
  status: 'received';
}

@Injectable()
export class HttpContactSubmissionGateway implements ContactSubmissionGateway {
  constructor(private readonly http: HttpClient) {}

  submit(payload: ContactFormPayload): Observable<ContactResponse> {
    return this.http
      .post<ContactApiResponse>('/api/contact-requests', payload)
      .pipe(
        map(() => ({
          message:
            'Your estimate request has been received. Austin Surface Pros will contact you soon.'
        }))
      );
  }
}
