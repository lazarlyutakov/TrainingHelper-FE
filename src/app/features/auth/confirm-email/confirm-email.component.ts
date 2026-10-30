import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { authErrorCode, authErrorMessage } from '../../../core/utils/auth-error';

/** Opened from the registration email: confirms the account and signs the user in. */
@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="card">
        @switch (state()) {
          @case ('confirming') {
            <h1>Confirming your email…</h1>
            <p class="status">Please wait a moment.</p>
          }
          @case ('confirmed') {
            <h1>✅ Email confirmed</h1>
            <p class="status">Your account is active. Taking you to your dashboard…</p>
          }
          @case ('already') {
            <h1>✅ Already confirmed</h1>
            <p class="status">{{ message() }}</p>
            <div class="links"><a routerLink="/login">Go to login</a></div>
          }
          @default {
            <h1>Confirmation failed</h1>
            <div class="alert alert-error">{{ message() }}</div>
            <div class="links"><a routerLink="/login">Go to login</a></div>
          }
        }
      </div>
    </div>
  `,
  styleUrl: '../auth-page.css'
})
export class ConfirmEmailComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  state = signal<'confirming' | 'confirmed' | 'already' | 'failed'>('confirming');
  message = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.fail('This confirmation link is invalid.');
      return;
    }

    this.auth.confirmEmail(token).subscribe({
      next: () => {
        this.state.set('confirmed');
        // Re-read the session so a slower /api/me from app start-up (made before the cookie existed) can't win.
        setTimeout(() => this.auth.checkAuth().subscribe(() => this.router.navigate(['/dashboard'])), 1500);
      },
      error: err => {
        if (authErrorCode(err) === 'already_confirmed') {
          this.state.set('already');
          this.message.set(authErrorMessage(err));
        } else {
          this.fail(authErrorMessage(err));
        }
      }
    });
  }

  private fail(message: string): void {
    this.state.set('failed');
    this.message.set(message);
  }
}
