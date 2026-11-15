import { Routes } from '@angular/router';
import { adminGuard } from './core/routing/admin-guard';
import { guestGuard } from './core/routing/guest-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/users/user-search-page/user-search-page').then((m) => m.UserSearchPage),
  },
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/sign-in-page/sign-in-page').then((m) => m.SignInPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users-page/admin-users-page').then(
            (m) => m.AdminUsersPage,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./core/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
