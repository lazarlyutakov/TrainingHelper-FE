import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
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
  { path: '**', redirectTo: 'dashboard' }
];

