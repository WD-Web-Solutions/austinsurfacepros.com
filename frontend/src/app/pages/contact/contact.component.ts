import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { SeoService } from '../../core/services/seo.service';
import { SERVICE_AREA_CONFIG } from '../services/service-area-map/service-area.config';
import { ServiceAreaCoverageService } from '../services/service-area-map/service-area-coverage.service';
import type {
  AddressCoverage,
  AddressSuggestion
} from '../services/service-area-map/service-area-coverage.service';
import { ContactFormPayload, ContactService } from './contact.service';

const contactMethodValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const email = String(control.get('emailAddress')?.value ?? '').trim();
  const phone = String(control.get('phone')?.value ?? '').trim();
  return email || phone ? null : { contactMethodRequired: true };
};

const DEMO_PROJECT_ADDRESS: AddressSuggestion = {
  label: '100 Congress Avenue, Austin, Texas 78701',
  addressLine: '100 Congress Avenue',
  city: 'Austin',
  state: 'TX',
  postcode: '78701',
  lat: 30.2648,
  lng: -97.7438
};

const DEMO_CONTACT_FORM_VALUES = {
  propertyType: 'Retail or office',
  service: 'Parking Lot Striping, Surface Cleaning',
  message:
    'Refresh the faded parking lot striping and clean the main customer entrance.',
  addressLine: DEMO_PROJECT_ADDRESS.addressLine,
  addressVerified: true,
  city: DEMO_PROJECT_ADDRESS.city,
  state: DEMO_PROJECT_ADDRESS.state,
  postalCode: DEMO_PROJECT_ADDRESS.postcode,
  timeline: 'Within 1–3 months',
  name: 'Jordan Lee',
  company: 'Capitol Plaza Management',
  emailAddress: 'jordan.lee@example.com',
  phone: '512-555-0147'
} as const;

type ContactControlName =
  | 'propertyType'
  | 'service'
  | 'message'
  | 'addressLine'
  | 'addressVerified'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'timeline'
  | 'name'
  | 'company'
  | 'emailAddress'
  | 'phone';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css', './contact-address.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnDestroy {
  @ViewChild('estimateForm', { read: ElementRef })
  private estimateForm?: ElementRef<HTMLFormElement>;
  @ViewChild('serviceabilityDialog', { read: ElementRef })
  private serviceabilityDialog?: ElementRef<HTMLDialogElement>;

  readonly isDemo = environment.demoMode;
  readonly steps = ['Property', 'Surface', 'Timing', 'Photos', 'Contact'];
  readonly propertyTypes = [
    { value: 'Retail or office', icon: '▧' },
    { value: 'Multifamily', icon: '⌂' },
    { value: 'Industrial', icon: '▤' },
    { value: 'Other commercial property', icon: '＋' }
  ];
  readonly services = [
    { value: 'Parking Lot Striping', label: 'Striping', icon: 'square-parking' },
    { value: 'Seal Coat & Asphalt', label: 'Asphalt', icon: 'road' },
    { value: 'Concrete Repairs', label: 'Concrete', icon: 'trowel' },
    { value: 'Steel Coating', label: 'Steel coating', icon: 'shield' },
    { value: 'Surface Cleaning', label: 'Cleaning', icon: 'broom' },
    { value: 'Commercial Signage', label: 'Signage', icon: 'sign-hanging' }
  ];
  readonly timelines = [
    'As soon as practical',
    'Within 1–3 months',
    'Planning ahead'
  ];
  readonly addressSuggestions = signal<readonly AddressSuggestion[]>([]);
  readonly addressSuggestionsOpen = signal(false);
  readonly activeAddressSuggestionIndex = signal(-1);
  readonly isSearchingAddress = signal(false);
  readonly addressCoverage = signal<AddressCoverage | null>(null);
  readonly addressLookupMessage = signal('');
  readonly minimumAddressSearchLength: number;
  readonly coreRadiusMiles = SERVICE_AREA_CONFIG.coreRadiusMiles;

  readonly contactForm;
  currentStep = 1;
  isSubmitting = false;
  submitAttempted = false;
  successMessage = '';
  errorMessage = '';
  photoError = '';
  selectedPhotos: readonly File[] = [];
  private acknowledgedOutsideAddress = '';
  private addressBlurTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly contactService: ContactService,
    private readonly seoService: SeoService,
    private readonly coverageService: ServiceAreaCoverageService,
    private readonly destroyRef: DestroyRef
  ) {
    this.minimumAddressSearchLength = this.coverageService.minimumSearchLength;
    this.contactForm = this.formBuilder.nonNullable.group(
      {
        propertyType: ['', [Validators.required, Validators.maxLength(120)]],
        service: ['', [Validators.required, Validators.maxLength(200)]],
        message: ['', [Validators.required, Validators.maxLength(4000)]],
        addressLine: ['', [Validators.required, Validators.maxLength(240)]],
        addressVerified: [false, [Validators.requiredTrue]],
        city: ['', [Validators.required, Validators.maxLength(120)]],
        state: ['', [Validators.required, Validators.maxLength(60)]],
        postalCode: [
          '',
          [Validators.required, Validators.pattern(/^\d{5}(?:-\d{4})?$/)]
        ],
        timeline: ['', [Validators.required, Validators.maxLength(120)]],
        name: ['', [Validators.required, Validators.maxLength(200)]],
        company: ['', [Validators.maxLength(200)]],
        emailAddress: ['', [Validators.email, Validators.maxLength(254)]],
        phone: ['', [Validators.maxLength(40)]]
      },
      { validators: contactMethodValidator }
    );

    this.contactForm.controls.addressLine.valueChanges
      .pipe(
        map(value => value.trim()),
        tap(() => this.resetSelectedAddress()),
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(query => this.searchAddresses(query)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(suggestions => {
        this.addressSuggestions.set(suggestions);
        this.addressSuggestionsOpen.set(suggestions.length > 0);
      });

    this.resetFormToModeDefaults();

    this.seoService.updatePage(
      'Request an Estimate | Austin Surface Pros',
      'Share your commercial property and surface needs with Austin Surface Pros to request a project estimate.'
    );
  }

  chooseProperty(value: string): void {
    this.contactForm.controls.propertyType.setValue(value);
    this.contactForm.controls.propertyType.markAsTouched();
  }

  ngOnDestroy(): void {
    if (this.addressBlurTimer) clearTimeout(this.addressBlurTimer);
  }

  onAddressFocus(): void {
    if (this.addressSuggestions().length > 0) {
      this.addressSuggestionsOpen.set(true);
    }
  }

  onAddressBlur(): void {
    this.addressBlurTimer = setTimeout(() => this.addressSuggestionsOpen.set(false), 120);
  }

  onAddressKeydown(event: KeyboardEvent): void {
    const suggestions = this.addressSuggestions();

    if (event.key === 'Escape') {
      this.addressSuggestionsOpen.set(false);
      this.activeAddressSuggestionIndex.set(-1);
      return;
    }

    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.addressSuggestionsOpen.set(true);
      this.activeAddressSuggestionIndex.update(index => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.addressSuggestionsOpen.set(true);
      this.activeAddressSuggestionIndex.update(index =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
    } else if (event.key === 'Enter' && this.addressSuggestionsOpen()) {
      event.preventDefault();
      this.selectAddressSuggestion(this.activeAddressSuggestion());
    }
  }

  checkAddressCoverage(): void {
    const suggestion = this.activeAddressSuggestion();
    if (suggestion) {
      this.selectAddressSuggestion(suggestion);
      return;
    }

    this.addressLookupMessage.set(
      'Enter at least four characters, then choose a suggested address.'
    );
    this.contactForm.controls.addressVerified.markAsTouched();
  }

  selectAddressSuggestion(suggestion: AddressSuggestion | undefined): void {
    if (!suggestion) return;

    this.acknowledgedOutsideAddress = '';
    this.addressCoverage.set(this.coverageService.evaluateAddress(suggestion));
    this.addressLookupMessage.set('');
    this.addressSuggestions.set([]);
    this.addressSuggestionsOpen.set(false);
    this.activeAddressSuggestionIndex.set(-1);
    this.contactForm.patchValue(
      {
        addressLine: suggestion.addressLine ?? suggestion.label,
        city: suggestion.city ?? '',
        state: suggestion.state ?? 'TX',
        postalCode: suggestion.postcode ?? '',
        addressVerified: true
      },
      { emitEvent: false }
    );
    this.contactForm.controls.addressLine.markAsTouched();
    this.contactForm.controls.addressVerified.markAsTouched();
  }

  toggleService(value: string): void {
    const selectedServices = this.selectedServices;
    const nextServices = selectedServices.includes(value)
      ? selectedServices.filter(service => service !== value)
      : [...selectedServices, value];

    this.contactForm.controls.service.setValue(nextServices.join(', '));
    this.contactForm.controls.service.markAsTouched();
    this.contactForm.controls.service.markAsDirty();
  }

  isServiceSelected(value: string): boolean {
    return this.selectedServices.includes(value);
  }

  chooseTimeline(value: string): void {
    this.contactForm.controls.timeline.setValue(value);
    this.contactForm.controls.timeline.markAsTouched();
    this.currentStep = 4;
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      return;
    }

    while (this.currentStep < step) {
      const previousStep = this.currentStep;
      this.nextStep();
      if (this.currentStep === previousStep) break;
    }
  }

  nextStep(): void {
    if (!this.validateCurrentStep()) return;

    const coverage = this.addressCoverage();
    if (
      this.currentStep === 1 &&
      coverage?.kind === 'outside' &&
      this.acknowledgedOutsideAddress !== coverage.address.label
    ) {
      this.openServiceabilityDialog();
      return;
    }

    this.currentStep = Math.min(this.currentStep + 1, this.steps.length);
  }

  continueOutsideServiceArea(): void {
    const coverage = this.addressCoverage();
    if (coverage) this.acknowledgedOutsideAddress = coverage.address.label;
    this.closeServiceabilityDialog();
    this.currentStep = 2;
  }

  closeServiceabilityDialog(): void {
    const dialog = this.serviceabilityDialog?.nativeElement;
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  previousStep(): void {
    this.currentStep = Math.max(1, this.currentStep - 1);
  }

  handlePhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const invalid = files.find(
      file => !supportedTypes.has(file.type) || file.size > 5 * 1024 * 1024
    );

    if (files.length > 3) {
      this.photoError = 'Choose no more than three photos.';
      input.value = '';
      return;
    }

    if (invalid) {
      this.photoError = 'Use JPEG, PNG, or WebP photos no larger than 5 MB each.';
      input.value = '';
      return;
    }

    this.photoError = '';
    this.selectedPhotos = files;
  }

  removePhoto(index: number): void {
    this.selectedPhotos = this.selectedPhotos.filter((_, itemIndex) => itemIndex !== index);
  }

  submitContactForm(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.submitAttempted = true;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.currentStep = this.firstInvalidStep();
      this.errorMessage =
        'Please correct the highlighted fields before sending your project brief.';
      this.focusFirstInvalidControl();
      return;
    }

    this.isSubmitting = true;
    const value = this.contactForm.getRawValue();
    const payload: ContactFormPayload = {
      propertyType: value.propertyType,
      service: value.service,
      message: value.message,
      addressLine: value.addressLine,
      city: value.city,
      state: value.state,
      postalCode: value.postalCode,
      timeline: value.timeline,
      name: value.name,
      company: value.company || undefined,
      emailAddress: value.emailAddress || undefined,
      phone: value.phone || undefined
    };

    this.contactService
      .submitContactForm(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: response => {
          this.successMessage = response.message;
          this.resetFormToModeDefaults();
          this.selectedPhotos = [];
          this.submitAttempted = false;
          this.currentStep = 1;
        },
        error: () => {
          this.errorMessage = 'Unable to send request. Please try again.';
        }
      });
  }

  hasError(controlName: ContactControlName): boolean {
    const control = this.contactForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty || this.submitAttempted);
  }

  get hasContactMethodError(): boolean {
    return (
      this.contactForm.hasError('contactMethodRequired') &&
      (this.submitAttempted ||
        this.contactForm.controls.emailAddress.touched ||
        this.contactForm.controls.phone.touched)
    );
  }

  private get selectedServices(): string[] {
    const selectedValues = this.contactForm.controls.service.value;
    return selectedValues ? selectedValues.split(', ') : [];
  }

  private validateCurrentStep(): boolean {
    const controls = this.controlsForStep(this.currentStep);
    controls.forEach(control => control.markAsTouched());
    this.contactForm.updateValueAndValidity();

    const valid = controls.every(control => control.valid) &&
      (this.currentStep !== 5 || !this.contactForm.hasError('contactMethodRequired'));

    if (!valid) {
      this.errorMessage = 'Complete this step before continuing.';
      this.focusFirstInvalidControl();
    } else {
      this.errorMessage = '';
    }

    return valid;
  }

  private controlsForStep(step: number): AbstractControl[] {
    const controls = this.contactForm.controls;
    const controlNames: Record<number, ContactControlName[]> = {
      1: ['propertyType', 'addressLine', 'addressVerified', 'city', 'state', 'postalCode'],
      2: ['service', 'message'],
      3: ['timeline'],
      4: [],
      5: ['name', 'company', 'emailAddress', 'phone']
    };
    return (controlNames[step] ?? []).map(name => controls[name]);
  }

  private firstInvalidStep(): number {
    for (let step = 1; step <= 5; step += 1) {
      const hasInvalidControl = this.controlsForStep(step).some(control => control.invalid);
      const hasContactError = step === 5 && this.contactForm.hasError('contactMethodRequired');
      if (hasInvalidControl || hasContactError) return step;
    }
    return 1;
  }

  private focusFirstInvalidControl(): void {
    setTimeout(() => {
      const invalidControl = this.estimateForm?.nativeElement.querySelector<HTMLElement>(
        '[aria-invalid="true"]'
      );
      invalidControl?.focus();
    });
  }

  private activeAddressSuggestion(): AddressSuggestion | undefined {
    const suggestions = this.addressSuggestions();
    if (suggestions.length === 0) return undefined;
    const index = this.activeAddressSuggestionIndex() >= 0
      ? this.activeAddressSuggestionIndex()
      : 0;
    return suggestions[index];
  }

  private searchAddresses(query: string) {
    if (query.length < this.minimumAddressSearchLength) {
      this.isSearchingAddress.set(false);
      return of<readonly AddressSuggestion[]>([]);
    }

    this.isSearchingAddress.set(true);
    return this.coverageService.searchAddresses(query).pipe(
      catchError(() => {
        this.addressLookupMessage.set(
          'Address search is temporarily unavailable. Please try again shortly.'
        );
        return of<readonly AddressSuggestion[]>([]);
      }),
      finalize(() => this.isSearchingAddress.set(false))
    );
  }

  private resetSelectedAddress(): void {
    this.acknowledgedOutsideAddress = '';
    this.addressCoverage.set(null);
    this.addressLookupMessage.set('');
    this.activeAddressSuggestionIndex.set(-1);
    this.contactForm.controls.addressVerified.setValue(false, { emitEvent: false });
  }

  private resetFormToModeDefaults(): void {
    this.contactForm.reset(
      this.isDemo ? DEMO_CONTACT_FORM_VALUES : undefined,
      { emitEvent: false }
    );
    this.addressSuggestions.set([]);
    this.addressSuggestionsOpen.set(false);
    this.resetSelectedAddress();

    if (this.isDemo) {
      this.contactForm.controls.addressVerified.setValue(true, { emitEvent: false });
      this.addressCoverage.set(
        this.coverageService.evaluateAddress(DEMO_PROJECT_ADDRESS)
      );
    }
  }

  private openServiceabilityDialog(): void {
    const dialog = this.serviceabilityDialog?.nativeElement;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
}
