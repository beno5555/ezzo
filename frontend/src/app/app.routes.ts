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
  {
    path: 'feed',
    title: 'feed',
    canActivate: [authGuard],
    loadComponent: () => import('./features/posts/feed-page/feed-page').then((m) => m.FeedPage),
  },
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
  { ...placeholderPage('settings', 'settings'), canActivate: [authGuard] },
  { ...placeholderPage('friends', 'friends'), canActivate: [authGuard] },
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
