import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    // Target of the link in the registration email
    path: 'confirm-email',
    loadComponent: () => import('./features/auth/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    // Target of the link in the password reset email
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    // Must come before 'activities/:id' so "new" isn't treated as an id
    path: 'activities/new',
    loadComponent: () => import('./features/add-activity/add-activity.component').then(m => m.AddActivityComponent),
    canActivate: [authGuard]
  },
  {
    path: 'activities/:id',
    loadComponent: () => import('./features/activity-detail/activity-detail.component').then(m => m.ActivityDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'coaching',
    loadComponent: () => import('./features/coaching/coaching.component').then(m => m.CoachingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'import',
    loadComponent: () => import('./features/import-activities/import-activities.component').then(m => m.ImportActivitiesComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];

