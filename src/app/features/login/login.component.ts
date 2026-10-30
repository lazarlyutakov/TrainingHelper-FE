import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { authErrorCode, authErrorMessage } from '../../core/utils/auth-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth/auth-page.css'
})
export class LoginComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  submitting = signal(false);
  error = signal<string | null>(null);
  /** Set when the password was right but the email isn't confirmed — offers to resend the link. */
  needsConfirmation = signal(false);
  resending = signal(false);
  /** Success message, e.g. after a password reset (?notice=password-reset) or a resent link. */
  notice = signal<string | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('notice') === 'password-reset'
      ? 'Your password has been changed. You can now log in.'
      : null);

  login(): void {
    if (!this.username.trim() || !this.password) return;
    this.submitting.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.needsConfirmation.set(false);

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.submitting.set(false);
        this.error.set(authErrorMessage(err));
        this.needsConfirmation.set(authErrorCode(err) === 'email_not_confirmed');
      }
    });
  }

  resendConfirmation(): void {
    this.resending.set(true);
    this.auth.resendConfirmation(this.username.trim()).subscribe({
      next: () => {
        this.resending.set(false);
        this.error.set(null);
        this.needsConfirmation.set(false);
        this.notice.set('A new confirmation link has been sent. Check your inbox (and spam folder).');
      },
      error: err => {
        this.resending.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }
}
