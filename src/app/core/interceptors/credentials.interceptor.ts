import { HttpInterceptorFn } from '@angular/common/http';

// Attach cookies on every request (needed for cross-origin in production)
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

