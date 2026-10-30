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

  /** Username (or email) + password login. On success the session cookie is set and the user is cached. */
  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/api/auth/login`, { username, password }).pipe(
      tap(user => this.setUser(user))
    );
  }

  /** Creates a username/password account and signs the new user in. */
  register(username: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/api/auth/register`, { username, email, password }).pipe(
      tap(user => this.setUser(user))
    );
  }

  private setUser(user: User): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.isLoading.set(false);
  }

  loginWithStrava(): void {
    window.location.href = `${environment.apiUrl}/auth/strava/start`;
  }

  logout(): void {
    window.location.href = `${environment.apiUrl}/logout`;
  }
}

