import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DemoAuthService } from '../../core/services/demo-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  readonly auth = inject(DemoAuthService);
  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  useDemoCredentials(): void {
    this.form.setValue({ email: this.auth.demoEmail, password: this.auth.demoPassword });
    this.error.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const credentials = this.form.getRawValue();
    if (!this.auth.login(credentials.email, credentials.password)) {
      this.error.set('Those credentials do not match the local demo administrator.');
      return;
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin/blogs';
    void this.router.navigateByUrl(returnUrl.startsWith('/') ? returnUrl : '/admin/blogs');
  }

}
