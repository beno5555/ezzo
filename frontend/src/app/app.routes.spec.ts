import { CanActivateFn, Route } from '@angular/router';
import { routes } from './app.routes';
import { english } from './core/languages/english';
import { adminGuard } from './core/routing/admin-guard';
import { authGuard } from './core/routing/auth-guard';
import { guestGuard } from './core/routing/guest-guard';

type Access = 'anyone' | 'auth' | 'guest' | 'admin';

// The address table in .scratch/frontend/spec.md ("Addresses"), path by path.
const addressTable: Record<string, Access> = {
  '': 'anyone',
  feed: 'auth',
  'sign-in': 'guest',
  register: 'guest',
  'forgot-password': 'anyone',
  'reset-password': 'anyone',
  'reactivate-account': 'anyone',
  'posts/new': 'auth',
  'posts/:postId': 'anyone',
  'users/:username': 'anyone',
  search: 'anyone',
  settings: 'auth',
  friends: 'auth',
  messages: 'auth',
  'messages/:username': 'auth',
  'admin/users': 'admin',
  'admin/reports': 'admin',
  'admin/moderation': 'admin',
  'admin/logs': 'admin',
  'admin/statistics': 'admin',
  '**': 'anyone',
};

const guardAccess = new Map<CanActivateFn, Access>([
  [authGuard, 'auth'],
  [guestGuard, 'guest'],
  [adminGuard, 'admin'],
]);

// A route at the end of the tree, with its full path and every guard on the way to it.
type FlatRoute = { path: string; route: Route; guards: unknown[] };

function flatten(tree: Route[], parentPath = '', parentGuards: unknown[] = []): FlatRoute[] {
  return tree.flatMap((route) => {
    const path = [parentPath, route.path ?? ''].filter((part) => part !== '').join('/');
    const guards = [...parentGuards, ...(route.canActivate ?? [])];
    return route.children ? flatten(route.children, path, guards) : [{ path, route, guards }];
  });
}

const flatRoutes = flatten(routes);
const pages = flatRoutes.filter(({ route }) => route.redirectTo === undefined);

describe('the route table', () => {
  it('has a page for every address in the spec, and no other', () => {
    expect(pages.map(({ path }) => path).sort()).toEqual(Object.keys(addressTable).sort());
  });

  it.each(Object.entries(addressTable))('lets %s be opened by %s', (path, access) => {
    const page = pages.find((candidate) => candidate.path === path);
    const accesses = page?.guards.map((guard) => guardAccess.get(guard as CanActivateFn));

    expect(accesses).toEqual(access === 'anyone' ? [] : [access]);
  });

  it('loads every page lazily', () => {
    const eagerPages = pages
      .filter(({ route }) => route.loadComponent === undefined || route.component !== undefined)
      .map(({ path }) => path);

    expect(eagerPages).toEqual([]);
  });

  it('titles every page with a key of the dictionary', () => {
    const untitledPages = pages
      .filter(({ route }) => typeof route.title !== 'string' || !(route.title in english.pages))
      .map(({ path }) => path);

    expect(untitledPages).toEqual([]);
  });

  // A fixed word beside :username would hide the user of that name: /users/settings could not be
  // both a page and the profile of a user called "settings".
  it('puts no fixed word beside a :username', () => {
    const paths = flatRoutes.map(({ path }) => path.split('/'));
    const clashes = paths.flatMap((segments) =>
      segments.flatMap((segment, index) => {
        const prefix = segments.slice(0, index).join('/');
        const isUsername = segment === ':username';
        return isUsername
          ? paths
              .filter(
                (other) =>
                  other.length > index &&
                  other.slice(0, index).join('/') === prefix &&
                  !other[index].startsWith(':'),
              )
              .map((other) => other.join('/'))
          : [];
      }),
    );

    expect(clashes).toEqual([]);
  });

  it('sends /admin on to /admin/users', () => {
    const adminRedirect = flatRoutes.find(
      ({ path, route }) => path === 'admin' && route.redirectTo !== undefined,
    );

    expect(adminRedirect?.route).toMatchObject({ redirectTo: 'users', pathMatch: 'full' });
  });
});
