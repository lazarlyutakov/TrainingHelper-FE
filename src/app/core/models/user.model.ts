export interface User {
  athleteId: number;
  displayName: string;
}

/** Error body of the /api/auth endpoints. */
export interface AuthError {
  error: string;
  message: string;
}

/** Body of a successful registration — the account must be confirmed via email before logging in. */
export interface RegisterResponse {
  email: string;
}

export interface MessageResponse {
  message: string;
}

