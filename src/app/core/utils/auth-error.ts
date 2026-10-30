import { HttpErrorResponse } from '@angular/common/http';
import { AuthError } from '../models/user.model';

/** User-facing message for a failed /api/auth request. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    const message = (err.error as AuthError | null)?.message;
    if (message) return message;
    if (err.status === 0) return 'Cannot reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
