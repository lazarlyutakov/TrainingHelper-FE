import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { authErrorMessage } from '../../../core/utils/auth-error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <h1>Forgot password?</h1>
        @if (sent()) {
          <div class="alert alert-success">
            If an account matches <strong>{{ usernameOrEmail.trim() }}</strong>, we've sent a link to reset the password.
            Check your inbox (and spam folder). The link is valid for 1 hour.
          </div>
        } @else {
          <p class="subtitle">Enter your username or email and we'll send you a link to reset your password.</p>

          <form (ngSubmit)="submit()">
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <div class="field">
              <label for="usernameOrEmail">Username or email</label>
              <input id="usernameOrEmail" name="usernameOrEmail" type="text" autocomplete="username" required
                     [(ngModel)]="usernameOrEmail" />
            </div>
            <button type="submit" class="primary-btn" [disabled]="submitting() || !usernameOrEmail.trim()">
              {{ submitting() ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>
        }

        <div class="links">
          <a routerLink="/login">Back to login</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../auth-page.css'
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  usernameOrEmail = '';
  submitting = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    if (!this.usernameOrEmail.trim()) return;
    this.submitting.set(true);
    this.error.set(null);

    this.auth.forgotPassword(this.usernameOrEmail.trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }
}
