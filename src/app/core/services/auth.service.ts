import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);

  checkAuth(): Observable<User | null> {
    return this.http.get<User>(`${environment.apiUrl}/api/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  loginWithStrava(): void {
    window.location.href = `${environment.apiUrl}/auth/strava/start`;
  }

  logout(): void {
    window.location.href = `${environment.apiUrl}/logout`;
  }
}

