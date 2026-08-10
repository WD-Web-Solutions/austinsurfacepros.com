import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { DemoAuthService } from '../../core/services/demo-auth.service';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  readonly demoAuth = inject(DemoAuthService);
  readonly isDemo = environment.demo && environment.blog.useLocalRepository;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  @ViewChild('loginFormElement', { read: ElementRef })
  private formElement?: ElementRef<HTMLFormElement>;

  readonly loginForm = this.formBuilder.nonNullable.group({
    emailAddress: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    this.seoService.updatePage(
      'Login | Austin Surface Pros',
      this.isDemo
        ? 'Austin Surface Pros browser-local demo content studio login.'
        : 'Austin Surface Pros account login.',
      'noindex, nofollow'
    );
  }

  useDemoCredentials(): void {
    this.loginForm.setValue({
      emailAddress: this.demoAuth.demoEmail,
      password: this.demoAuth.demoPassword
    });
    this.errorMessage.set('');
  }

  submitLoginForm(): void {
    this.errorMessage.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Please correct the highlighted fields and try again.');
      this.focusFirstInvalidControl();
      return;
    }

    const credentials = this.loginForm.getRawValue();
    if (this.isDemo) {
      if (!this.demoAuth.login(credentials.emailAddress, credentials.password)) {
        this.errorMessage.set('Those credentials do not match the local demo administrator.');
        return;
      }
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin/blogs';
      void this.router.navigateByUrl(returnUrl.startsWith('/') ? returnUrl : '/admin/blogs');
      return;
    }

    this.isSubmitting.set(true);
    this.authService
      .login(credentials)
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
