import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { authErrorMessage } from '../../../core/utils/auth-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../auth-page.css'
})
export class RegisterComponent {
  private auth = inject(AuthService);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  submitting = signal(false);
  error = signal<string | null>(null);
  /** Email the confirmation link was sent to; switches the page to the "check your inbox" view. */
  registeredEmail = signal<string | null>(null);
  resending = signal(false);
  resent = signal(false);

  register(): void {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    this.auth.register(this.username.trim(), this.email.trim(), this.password).subscribe({
      next: res => {
        this.submitting.set(false);
        this.registeredEmail.set(res.email);
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }

  resend(): void {
    this.resending.set(true);
    this.error.set(null);
    this.auth.resendConfirmation(this.registeredEmail()!).subscribe({
      next: () => {
        this.resending.set(false);
        this.resent.set(true);
      },
      error: err => {
        this.resending.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }
}
