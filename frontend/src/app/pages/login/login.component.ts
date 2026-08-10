import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  @ViewChild('loginFormElement', { read: ElementRef })
  private formElement?: ElementRef<HTMLFormElement>;

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly loginForm = this.formBuilder.nonNullable.group({
    emailAddress: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    this.seoService.updatePage(
      'Login | Austin Surface Pros',
      'Austin Surface Pros account login.',
      'noindex, nofollow'
    );
  }

  submitLoginForm(): void {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Please correct the highlighted fields and try again.');
      this.focusFirstInvalidControl();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: error => {
          this.errorMessage.set(
            error.status === 401
              ? 'Incorrect email address or password.'
              : 'Unable to log in. Please try again.'
          );
        }
      });
  }

  hasError(controlName: keyof typeof this.loginForm.controls): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private focusFirstInvalidControl(): void {
    setTimeout(() => {
      this.formElement?.nativeElement
        .querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }
}
