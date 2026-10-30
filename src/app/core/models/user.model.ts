export interface User {
  athleteId: number;
  displayName: string;
}

/** Error body of the /api/auth endpoints. */
export interface AuthError {
  error: string;
  message: string;
}

