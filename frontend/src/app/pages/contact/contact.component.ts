

import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import { RouterLink } from '@angular/router';

import {
  ContactService,
  ContactFormPayload
} from './contact.service';
import { environment } from '../../../environments/environment';

import { SeoService } from '../../core/services/seo.service';
import { HeroVideoComponent } from '../../shared/components/hero-video/hero-video.component';



@Component({

  selector: 'app-contact',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    HeroVideoComponent
],

  templateUrl:
    './contact.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl:
    './contact.component.css'

})
export class ContactComponent {

  readonly isDemo = environment.demoMode;


  @ViewChild('estimateForm', { read: ElementRef })
  private estimateForm?: ElementRef<HTMLFormElement>;


  isSubmitting = false;


  successMessage = '';

  errorMessage = '';



  contactForm;



  services = [

    'Steel Coating & Striping',

    'Seal Coat & Asphalt',

    'Concrete Repairs',

    'Parking Lot Maintenance',

    'Commercial Signage',

    'Wheel Stops & Speed Bumps'

  ];



  constructor(

    private readonly formBuilder: FormBuilder,

    private readonly contactService: ContactService,

    private readonly seoService: SeoService

  ) {


    this.contactForm =
      this.formBuilder.nonNullable.group({


        name: [

          '',

          [

            Validators.required,

            Validators.maxLength(200)

          ]

        ],



        emailAddress: [

          '',

          [

            Validators.required,

            Validators.email,

            Validators.maxLength(254)

          ]

        ],



        company: [

          '',

          [

            Validators.maxLength(200)

          ]

        ],



        phone: [

          '',

          [

            Validators.maxLength(40)

          ]

        ],



        service: [

          '',

          [

            Validators.required

          ]

        ],



        message: [

          '',

          [

            Validators.required,

            Validators.maxLength(4000)

          ]

        ]

      });


    this.seoService.updatePage(
      'Request an Estimate | Austin Surface Pros',
      'Contact Austin Surface Pros to request an estimate for asphalt, striping, concrete, coating, or commercial surface work.'
    );


  }




  submitContactForm(): void {


    this.successMessage = '';

    this.errorMessage = '';



    if (this.contactForm.invalid) {


      this.contactForm.markAllAsTouched();


      this.errorMessage =
        'Please correct the highlighted fields and try again.';


      setTimeout(() => {
        this.estimateForm?.nativeElement
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });


      return;

    }



    this.isSubmitting = true;



    const formValue =
      this.contactForm.getRawValue();



    const payload:
      ContactFormPayload = {


        name:
          formValue.name,


        emailAddress:
          formValue.emailAddress,


        company:
          formValue.company || undefined,


        phone:
          formValue.phone || undefined,


        service:
          formValue.service,


        message:
          formValue.message


      };




    this.contactService

      .submitContactForm(payload)

      .pipe(

        finalize(() => {

          this.isSubmitting = false;

        })

      )


      .subscribe({


        next: response => {


          this.successMessage =
            response.message;


          this.contactForm.reset();


        },


        error: () => {


          this.errorMessage =
            'Unable to send request. Please try again.';


        }


      });


  }




  hasError(
    controlName:
      keyof typeof this.contactForm.controls

  ): boolean {


    const control =
      this.contactForm.controls[controlName];



    return (

      control.invalid &&

      (control.touched || control.dirty)

    );


  }


}
