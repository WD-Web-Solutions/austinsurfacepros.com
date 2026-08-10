import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { ContactComponent } from './contact.component';
import { CONTACT_SUBMISSION_GATEWAY } from './contact-submission.gateway';
import { DemoContactSubmissionGateway } from './demo-contact-submission.gateway';

describe('ContactComponent guided estimate flow', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: CONTACT_SUBMISSION_GATEWAY,
          useClass: DemoContactSubmissionGateway
        }
      ]
    }).compileComponents();
  });

  afterEach(() => vi.useRealTimers());

  it('starts with a single descriptive heading and five named steps', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const stepButtons = element.querySelectorAll('.estimate-rail button');

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('Request an estimate');
    expect(element.querySelector('.estimate-intro')).toBeNull();
    expect(stepButtons).toHaveLength(5);
    expect([...stepButtons].map(button => button.getAttribute('aria-label'))).toEqual([
      'Step 1: Property',
      'Step 2: Surface',
      'Step 3: Timing',
      'Step 4: Photos',
      'Step 5: Contact'
    ]);
    expect([...stepButtons].map(button => button.textContent?.trim())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Property'),
        expect.stringContaining('Surface'),
        expect.stringContaining('Photos'),
        expect.stringContaining('Contact')
      ])
    );
    expect([...stepButtons].some(button => button.textContent?.includes('Address'))).toBe(false);
  });

  it('places the validated address fields on the property step', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    for (const id of ['contact-address', 'contact-city', 'contact-state', 'contact-postal']) {
      expect(element.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(element.querySelector(`#${id}`)?.hasAttribute('required')).toBe(true);
    }
    expect(element.querySelector('#contact-address')?.getAttribute('role')).toBe('combobox');
    expect(element.querySelector('#contact-address-privacy')?.textContent).toContain(
      'sent to'
    );
  });

  it('shows sample placeholders without prefilling the standard form', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLInputElement>('#contact-address')?.placeholder).toBe(
      'Start typing the property address'
    );
    expect(element.querySelector<HTMLInputElement>('#contact-city')?.placeholder).toBe(
      'Austin'
    );
    expect(element.querySelector<HTMLInputElement>('#contact-state')?.placeholder).toBe(
      'TX'
    );
    expect(element.querySelector<HTMLInputElement>('#contact-postal')?.placeholder).toBe(
      '78701'
    );
    expect(component.contactForm.getRawValue()).toEqual({
      propertyType: '',
      service: '',
      message: '',
      addressLine: '',
      addressVerified: false,
      city: '',
      state: '',
      postalCode: '',
      timeline: '',
      name: '',
      company: '',
      emailAddress: '',
      phone: ''
    });

    const surfaceFixture = TestBed.createComponent(ContactComponent);
    surfaceFixture.componentInstance.currentStep = 2;
    surfaceFixture.detectChanges();
    expect(
      (surfaceFixture.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>(
        '#contact-message'
      )?.placeholder
    ).toContain('Cracking near the loading area');

    const contactFixture = TestBed.createComponent(ContactComponent);
    contactFixture.componentInstance.currentStep = 5;
    contactFixture.detectChanges();
    const contactElement = contactFixture.nativeElement as HTMLElement;
    expect(contactElement.querySelector<HTMLInputElement>('#contact-name')?.placeholder).toBe(
      'Jordan Lee'
    );
    expect(contactElement.querySelector<HTMLInputElement>('#contact-company')?.placeholder).toBe(
      'Capitol Plaza Management'
    );
    expect(contactElement.querySelector<HTMLInputElement>('#contact-email')?.placeholder).toBe(
      'jordan.lee@example.com'
    );
    expect(contactElement.querySelector<HTMLInputElement>('#contact-phone')?.placeholder).toBe(
      '512-555-0147'
    );
  });

  it('prefills a complete sample project in demo mode only', () => {
    const mutableEnvironment = environment as unknown as { demoMode: boolean };
    const previousDemoMode = mutableEnvironment.demoMode;
    mutableEnvironment.demoMode = true;

    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;

    try {
      fixture.detectChanges();
      expect(component.contactForm.getRawValue()).toEqual({
        propertyType: 'Retail or office',
        service: 'Parking Lot Striping, Surface Cleaning',
        message:
          'Refresh the faded parking lot striping and clean the main customer entrance.',
        addressLine: '100 Congress Avenue',
        addressVerified: true,
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        timeline: 'Within 1–3 months',
        name: 'Jordan Lee',
        company: 'Capitol Plaza Management',
        emailAddress: 'jordan.lee@example.com',
        phone: '512-555-0147'
      });
      expect(component.addressCoverage()?.kind).toBe('covered');
    } finally {
      fixture.destroy();
      mutableEnvironment.demoMode = previousDemoMode;
    }
  });

  it('allows an outside-range address after showing the serviceability dialog', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.chooseProperty('Retail or office');
    component.selectAddressSuggestion({
      label: '100 Main Plaza, New Braunfels, Texas 78130',
      addressLine: '100 Main Plaza',
      city: 'New Braunfels',
      state: 'Texas',
      postcode: '78130',
      lat: 29.703,
      lng: -98.1245
    });
    component.nextStep();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      '.serviceability-dialog'
    ) as HTMLDialogElement;
    const rangeLink = dialog.querySelector<HTMLAnchorElement>(
      'a[href="/services#service-area-checker"]'
    );

    expect(component.currentStep).toBe(1);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('might be outside our serviceable range');
    expect(rangeLink).not.toBeNull();

    component.continueOutsideServiceArea();
    fixture.detectChanges();
    expect(component.currentStep).toBe(2);
  });

  it('uses the shared Photon search and fills the selected project address', async () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
    fixture.detectChanges();

    component.contactForm.controls.addressLine.setValue('100 Congress Avenue');
    await vi.advanceTimersByTimeAsync(350);

    const request = http.expectOne(candidate =>
      candidate.url === 'https://photon.komoot.io/api/' &&
      candidate.params.get('q') === '100 Congress Avenue'
    );
    request.flush({
      features: [
        {
          geometry: { type: 'Point', coordinates: [-97.7438, 30.2648] },
          properties: {
            housenumber: '100',
            street: 'Congress Avenue',
            city: 'Austin',
            state: 'Texas',
            postcode: '78701'
          }
        }
      ]
    });
    fixture.detectChanges();

    const suggestion = fixture.nativeElement.querySelector(
      '.address-suggestions button'
    ) as HTMLButtonElement;
    suggestion.click();
    fixture.detectChanges();

    expect(component.contactForm.controls.addressLine.value).toBe('100 Congress Avenue');
    expect(component.contactForm.controls.city.value).toBe('Austin');
    expect(component.contactForm.controls.postalCode.value).toBe('78701');
    expect(component.contactForm.controls.addressVerified.value).toBe(true);
    expect(component.addressCoverage()?.kind).toBe('covered');
    http.verify();
  });

  it('offers an accessible multi-select service button list', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    component.currentStep = 2;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const serviceButtons = element.querySelectorAll<HTMLButtonElement>(
      '.service-choices button'
    );

    expect(serviceButtons).toHaveLength(6);
    expect(element.querySelector('select[formControlName="service"]')).toBeNull();
    expect(element.querySelector('.service-fieldset legend')?.textContent).toContain(
      'choose one or more'
    );
    expect(serviceButtons[0].textContent).toContain('Striping');
    expect(serviceButtons[1].textContent).toContain('Asphalt');

    serviceButtons[0].click();
    serviceButtons[2].click();
    fixture.detectChanges();

    expect(component.contactForm.controls.service.value).toBe(
      'Parking Lot Striping, Concrete Repairs'
    );
    expect(serviceButtons[0].getAttribute('aria-pressed')).toBe('true');
    expect(serviceButtons[2].getAttribute('aria-pressed')).toBe('true');

    serviceButtons[0].click();
    fixture.detectChanges();
    expect(component.contactForm.controls.service.value).toBe('Concrete Repairs');
    expect(serviceButtons[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps email and phone together and requires at least one contact method', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    component.currentStep = 5;
    fixture.detectChanges();

    const methodGrid = fixture.nativeElement.querySelector(
      '.contact-methods .contact-grid'
    ) as HTMLElement;
    expect(methodGrid.querySelector('#contact-email')).not.toBeNull();
    expect(methodGrid.querySelector('#contact-phone')).not.toBeNull();

    component.contactForm.controls.emailAddress.markAsTouched();
    component.contactForm.controls.phone.markAsTouched();
    component.contactForm.updateValueAndValidity();
    fixture.detectChanges();
    expect(component.hasContactMethodError).toBe(true);
    expect(methodGrid.closest('fieldset')?.textContent).toContain('at least one required');

    component.contactForm.controls.phone.setValue('512-555-0100');
    component.contactForm.updateValueAndValidity();
    fixture.detectChanges();
    expect(component.hasContactMethodError).toBe(false);
  });

  it('offers an optional local-only photo drop with a clear collection notice', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.componentInstance.currentStep = 4;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const photoInput = element.querySelector<HTMLInputElement>('#contact-photos');

    expect(photoInput?.multiple).toBe(true);
    expect(photoInput?.accept).toContain('image/jpeg');
    expect(element.querySelector('#photo-privacy-note')?.textContent).toContain(
      'remain on this device'
    );
    expect(element.querySelector('#photo-privacy-note')?.textContent).toContain(
      'not submitted'
    );
  });

  it('announces an invalid submission and focuses the first invalid step', async () => {
    const fixture = TestBed.createComponent(ContactComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.submitContactForm();
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Choose a property type');
    expect(component.currentStep).toBe(1);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Property type');
  });

  it('publishes the confirmed business contact email', () => {
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();

    const emailLink = fixture.nativeElement.querySelector(
      'a[href="mailto:austinsurfacepros@gmail.com"]'
    ) as HTMLAnchorElement | null;
    expect(emailLink?.textContent?.trim()).toBe('austinsurfacepros@gmail.com');
  });
});
