import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  submitting = signal(false);
  error = signal<string | null>(null);

  register(): void {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    // The backend signs the new user in, so go straight to the dashboard.
    this.auth.register(this.username.trim(), this.email.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.submitting.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }
}
