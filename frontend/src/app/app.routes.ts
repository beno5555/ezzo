import { Routes } from '@angular/router';
import { adminGuard } from './core/routing/admin-guard';
import { authGuard } from './core/routing/auth-guard';
import { guestGuard } from './core/routing/guest-guard';
import { PageTitleKey } from './core/routing/page-title-key';

// The address table in .scratch/frontend/spec.md ("Addresses"); app.routes.spec.ts holds this file to it.
// Every page loads lazily, and its title is a key of the dictionary's pages group (PageTitleStrategy).
// A page not built yet loads the placeholder, until its ticket puts the page in its place.
const placeholder = () =>
  import('./core/page-placeholder/page-placeholder').then((m) => m.PagePlaceholder);

function placeholderPage(path: string, title: PageTitleKey): Routes[number] {
  return { path, title, loadComponent: placeholder };
}

export const routes: Routes = [
  // The landing page. Ticket 26 sends a signed-in user on to the feed.
  { ...placeholderPage('', 'home'), pathMatch: 'full' },
  { ...placeholderPage('feed', 'feed'), canActivate: [authGuard] },
  {
    path: 'sign-in',
    title: 'signIn',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/sign-in-page/sign-in-page').then((m) => m.SignInPage),
  },
  {
    path: 'register',
    title: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    title: 'forgotPassword',
    loadComponent: () =>
      import('./features/auth/forgot-password-page/forgot-password-page').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    title: 'resetPassword',
    loadComponent: () =>
      import('./features/auth/reset-password-page/reset-password-page').then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: 'reactivate-account',
    title: 'reactivateAccount',
    loadComponent: () =>
      import('./features/auth/reactivate-account-page/reactivate-account-page').then(
        (m) => m.ReactivateAccountPage,
      ),
  },
  placeholderPage('posts/:postId', 'post'),
  placeholderPage('users/:username', 'profile'),
  {
    path: 'search',
    title: 'search',
    loadComponent: () =>
      import('./features/users/user-search-page/user-search-page').then((m) => m.UserSearchPage),
  },
  { ...placeholderPage('settings', 'settings'), canActivate: [authGuard] },
  { ...placeholderPage('friends', 'friends'), canActivate: [authGuard] },
  {
    path: 'messages',
    canActivate: [authGuard],
    children: [placeholderPage('', 'messages'), placeholderPage(':username', 'conversation')],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        title: 'adminUsers',
        loadComponent: () =>
          import('./features/admin/admin-users-page/admin-users-page').then(
            (m) => m.AdminUsersPage,
          ),
      },
      placeholderPage('reports', 'adminReports'),
      placeholderPage('moderation', 'adminModeration'),
      placeholderPage('logs', 'adminLogs'),
      placeholderPage('statistics', 'adminStatistics'),
    ],
  },
  {
    path: '**',
    title: 'notFound',
    loadComponent: () => import('./core/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
