import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { authErrorMessage } from '../../core/utils/auth-error';

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

  login(): void {
    if (!this.username.trim() || !this.password) return;
    this.submitting.set(true);
    this.error.set(null);

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.submitting.set(false);
        this.error.set(authErrorMessage(err));
      }
    });
  }
}
