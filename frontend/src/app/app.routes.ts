import { Route, Routes } from '@angular/router';
import { adminGuard } from './core/routing/admin-guard';
import { formerHomePaths } from './core/routing/app-addresses';
import { authGuard } from './core/routing/auth-guard';
import { guestGuard } from './core/routing/guest-guard';
import { landingPageMark } from './core/routing/landing-page-mark';
import { signedInMatch } from './core/routing/signed-in-match';

// The address table in .scratch/frontend/spec.md ("Addresses"); app.routes.spec.ts holds this file to it.
// Every page loads lazily, and its title is a key of the dictionary's pages group (PageTitleStrategy).

export const routes: Routes = [
  // The home address: the feed for a signed-in user, the landing page with the sign-in form for a guest.
  // The landing page has no title, so its tab says only "Ezzo".
  {
    path: '',
    pathMatch: 'full',
    title: 'feed',
    canMatch: [signedInMatch],
    loadComponent: () => import('./features/posts/feed-page/feed-page').then((m) => m.FeedPage),
  },
  {
    path: '',
    pathMatch: 'full',
    data: { [landingPageMark]: true },
    loadComponent: () =>
      import('./features/auth/landing-page/landing-page').then((m) => m.LandingPage),
  },
  // The redirect is relative, because only a relative one keeps the query.
  ...formerHomePaths.map((path): Route => ({ path, pathMatch: 'full', redirectTo: '' })),
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
  // Before posts/:postId, so that "new" is not read as a post's id.
  {
    path: 'posts/new',
    title: 'newPost',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/new-post-page/new-post-page').then((m) => m.NewPostPage),
  },
  {
    path: 'posts/:postId/edit',
    title: 'editPost',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/edit-post-page/edit-post-page').then((m) => m.EditPostPage),
  },
  {
    path: 'posts/:postId',
    title: 'post',
    loadComponent: () => import('./features/posts/post-page/post-page').then((m) => m.PostPage),
  },
  {
    path: 'users/:username',
    title: 'profile',
    loadComponent: () =>
      import('./features/users/profile-page/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'search',
    title: 'search',
    loadComponent: () =>
      import('./features/users/user-search-page/user-search-page').then((m) => m.UserSearchPage),
  },
  {
    path: 'settings',
    title: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/settings-page/settings-page').then((m) => m.SettingsPage),
  },
  {
    path: 'friends',
    title: 'friends',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/friendships/friends-page/friends-page').then((m) => m.FriendsPage),
  },
  // One layout for both: the list beside the open conversation on a desktop, one of them on a phone.
  // At /messages a desktop shows a hint where the conversation goes, and a phone only the list.
  {
    path: 'messages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/messages/messages-page/messages-page').then((m) => m.MessagesPage),
    children: [
      {
        path: '',
        title: 'messages',
        loadComponent: () =>
          import('./features/messages/no-conversation-page/no-conversation-page').then(
            (m) => m.NoConversationPage,
          ),
      },
      {
        path: ':username',
        title: 'messages',
        loadComponent: () =>
          import('./features/messages/conversation-page/conversation-page').then(
            (m) => m.ConversationPage,
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
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
      {
        path: 'reports',
        title: 'adminReports',
        loadComponent: () =>
          import('./features/admin/admin-reports-page/admin-reports-page').then(
            (m) => m.AdminReportsPage,
          ),
      },
      {
        path: 'moderation',
        title: 'adminModeration',
        loadComponent: () =>
          import('./features/admin/admin-moderation-page/admin-moderation-page').then(
            (m) => m.AdminModerationPage,
          ),
      },
      {
        path: 'logs',
        title: 'adminLogs',
        loadComponent: () =>
          import('./features/admin/admin-logs-page/admin-logs-page').then((m) => m.AdminLogsPage),
      },
      {
        path: 'statistics',
        title: 'adminStatistics',
        loadComponent: () =>
          import('./features/admin/admin-statistics-page/admin-statistics-page').then(
            (m) => m.AdminStatisticsPage,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'notFound',
    loadComponent: () => import('./core/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
