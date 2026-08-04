import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


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


@Injectable({
  providedIn: 'root'
})
export class ContactService {


  submitContactForm(
    payload: ContactFormPayload
  ): Observable<ContactResponse> {


    console.log(
      'Contact Request Submitted:',
      payload
    );


    return of({

      message:
        'Your estimate request has been received. Austin Surface Pros will contact you soon.'

    });


  }


}