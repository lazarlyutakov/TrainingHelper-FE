import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { authErrorMessage } from '../../../core/utils/auth-error';

/** Opened from the password reset email: lets the user choose a new password. */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <h1>Choose a new password</h1>

        @if (!token) {
          <div class="alert alert-error">This password reset link is invalid.</div>
          <div class="links"><a routerLink="/forgot-password">Request a new link</a></div>
        } @else {
          <form (ngSubmit)="submit()">
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <div class="field">
              <label for="password">New password</label>
              <input id="password" name="password" type="password" autocomplete="new-password" required
                     minlength="8" maxlength="128" [(ngModel)]="password" />
              <span class="hint">At least 8 characters, with a letter and a digit.</span>
            </div>
            <div class="field">
              <label for="confirmPassword">Confirm new password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required
                     [(ngModel)]="confirmPassword" />
            </div>
            <button type="submit" class="primary-btn" [disabled]="submitting() || !password || !confirmPassword">
              {{ submitting() ? 'Saving…' : 'Change password' }}
            </button>
          </form>

          <div class="links">
            <a routerLink="/forgot-password">Request a new link</a>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: '../auth-page.css'
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  password = '';
  confirmPassword = '';
  submitting = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    this.auth.resetPassword(this.token!, this.password).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { notice: 'password-reset' } }),
      error: err => {
        this.submitting.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }
}
