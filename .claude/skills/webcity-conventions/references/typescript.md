# TypeScript / JavaScript

Every general rule applies. This file shows the TypeScript form of each one.

## 1. Strict typing

Turn on `"strict": true` and never use `any`. Narrow `unknown` instead.

Avoid:
```ts
function parse(body: any) { return body.title; }
```

Prefer:
```ts
function parse(body: unknown): CreatePostInput {
  return createPostSchema.parse(body);
}
```

Use `const` by default. Use `let` only for the single result variable that branches reassign.

## 2. Result type

```ts
export type AppResult<T> =
  | { succeeded: true; message?: string; data: T }
  | { succeeded: false; message: string };

export const ok   = <T>(data: T, message?: string): AppResult<T> => ({ succeeded: true, data, message });
export const fail = <T>(message: string): AppResult<T> => ({ succeeded: false, message });
```

## 3. Control flow

Services use a single exit. Handlers may return early, with success first.

```ts
export async function updatePost(id: number, callerId: number, input: UpdatePostInput): Promise<AppResult<FullPostView>> {
  let result: AppResult<FullPostView>;
  const post = await postRepository.findById(id);

  if (post !== null) {
    const belongsToCaller = post.userId === callerId;
    if (belongsToCaller) {
      const updated = await postRepository.update(id, { ...input, lastUpdatedAt: new Date() });
      result = ok(toFullPostView(updated), responseMessages.postUpdated);
    } else {
      result = fail(responseMessages.postNotFound);
    }
  } else {
    result = fail(responseMessages.postNotFound);
  }

  return result;
}
```

```ts
router.put("/api/posts/:id", requireAuth, rateLimit(policies.updatePost), async (req, res) => {
  const result = await updatePost(Number(req.params.id), req.user.id, parseUpdatePost(req.body));

  if (result.succeeded) {
    return res.status(200).json(result);
  }

  return res.status(404).json(result);
});
```

## 4. Validate at the boundary using shared constants

```ts
export const createPostSchema = z.object({
  title: z.string().min(1).max(LIMITS.postTitleMaxLength),
  content: z.string().min(1).max(LIMITS.postContentMaxLength),
});
```

## 5. Async

Use `async/await`, not `.then()` chains. Never leave a promise floating.

Avoid:
```ts
notifyAuthor(comment);
```

Prefer:
```ts
await notifyAuthor(comment);
```

or, when fire-and-forget is intentional:
```ts
void notifyAuthor(comment); // fire-and-forget: notification failure must not fail the request
```

## 6. Naming

| Kind | Style | Example |
|---|---|---|
| Variables, functions | camelCase | `belongsToCaller`, `getFeed` |
| Types, classes | PascalCase, no `I` prefix | `PostRepository`, `FullPostView` |
| Constants | `as const` objects or SCREAMING_SNAKE | `LIMITS.maxPageSize`, `MAX_PAGE_SIZE` |
| Files | kebab-case (unless the project differs) | `post-service.ts` |

## 7. Mappers and messages

```ts
export const toMinimalUserView = (user: User): MinimalUserView => ({ id: user.id, username: user.username });

export const responseMessages = {
  postUpdated: "Post updated successfully",
  postNotFound: "Post not found",
} as const;
```

## 8. `type` vs `interface`

Use `type` for unions and data shapes, such as the DTOs that mirror the backend. Add an `interface` wherever it serves a purpose: a contract that more than one class implements, or a shape that other types extend. Don't add one for a class with a single implementation, such as an Angular service or an `…Api` class: like the backend's services, those are injected as concrete classes.

## 9. Formatting

Always use braces. If Prettier or ESLint is configured, its output wins; do not hand-align columns.

## 10. Frontend (Angular)

The frontend is an Angular 22 app in `frontend/`. Sections 1 to 9 apply to it; this section adds the Angular rules. The reasons behind the larger choices are in ADRs 0001 and 0003 to 0006.

### Baseline

- Use what the Angular CLI generates: standalone components, no zone.js, Vitest, Prettier. Never add NgModules or zone.js.
- Without zone.js the screen redraws only when a signal changes. Anything a template shows is a `signal` or a `computed`, never a plain field.
- Use the current idiom: `inject()` instead of constructor parameters, `@if` and `@for (...; track ...)` instead of `*ngIf` and `*ngFor`, `input()` and `output()` instead of decorators, `provideHttpClient` instead of `HttpClientModule`.
- Where this section is silent, follow the CLI's generated code.

### Structure and layering

```
frontend/src/app/
  core/       app-wide singletons: session, HTTP plumbing, hub client, languages, themes, error handling
  shared/     reusable presentational components and pipes; nothing routed
  features/   auth/ users/ posts/ comments/ friendships/ messages/ accounts/ admin/ reports/
```

- Feature folders are named after the backend's controllers. Each holds its pages, components, `…Api` service and DTO types.
- Dependencies point one way: **pages and components → stores → `…Api` services → `HttpClient`**. A page may call an `…Api` directly when no store is involved.
- Only `…Api` services use `HttpClient`. Only the hub client touches the SignalR connection.
- A feature may import another feature's DTO types, `…Api` and stores, never its pages or components. UI that two features need moves to `shared/`.

### Naming

Every class carries a role word, because the CLI no longer adds `Component` or `Service` and bare names would collide with DTO types.

| Kind | Class | File |
|---|---|---|
| Routed page | `FeedPage` | `feed-page.ts`, `.html`, `.css` |
| Reusable component | `PostCard` | `post-card.ts`, `.html`, `.css` |
| HTTP service, one per backend controller | `PostApi` | `post-api.ts` |
| Shared state | `SessionStore` | `session-store.ts` |
| Guard, interceptor | `authGuard`, `authInterceptor` | `auth-guard.ts`, `auth-interceptor.ts` |
| DTO type, the backend's exact name | `FullUserDto` | `full-user-dto.ts` |

- A component is three files (`templateUrl`, `styleUrl`) with the `app-` selector prefix.
- Use full words and one spelling per concept: `userApi`, never `serv`.

### DTO types and constants

- One `type` per file, named exactly as the backend DTO it mirrors, so one search finds both halves. `AppResult` and its `ok` and `fail` helpers share one file.
- Backend enums travel as text: the name of the member (`"Pending"`), in responses and in requests. Mirror each as an `as const` object whose values are those names:

```ts
export const FriendshipStatus = { Pending: 'Pending', Accepted: 'Accepted', Declined: 'Declined' } as const;
export type FriendshipStatus = (typeof FriendshipStatus)[keyof typeof FriendshipStatus];
```

- Times are ISO strings in DTO types (see Dates).
- Mirror the backend's limits by hand in one `LIMITS` file. Each group names the backend file it copies.

### API services and results

- Every `…Api` method returns `Promise<AppResult<T>>` and never throws for an expected failure. Callers `await` it and branch on `succeeded`.
- One helper in `core/`, `toAppResult`, converts the `HttpClient` Observable to that promise and maps failures. It is the only place that catches HTTP errors and the only place application code needs RxJS. It is a plain function, so the `…Api` method passes it the current dictionary's `httpFailures`.
- On the frontend, the failure branch of `AppResult` also carries `status: number` and an optional `fieldErrors` map of field name to messages.
- Endpoints that answer without the envelope (login and refresh return `{ accessToken }`) are wrapped into `AppResult` by their `…Api` method.
- URLs are relative (`/api/...`, `/hubs/...`), per ADR 0001. Path literals appear only in `…Api` files, and the hub's address only in the hub client.
- `…Api` services hold no state.
- Lists use infinite scroll. A page shorter than the page size is the last one.
- Where a newer request makes an older one stale (user search), ignore every response but the latest.

```ts
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  getMine(): Promise<AppResult<FullUserDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<FullUserDto>>('/api/users/mine'),
      this.languageStore.text().httpFailures,
    );
  }
}
```

### Errors

The backend has two failure shapes plus bodiless rejections (`docs/backend/auth.md`). `toAppResult` maps them all:

| Response | Becomes |
|---|---|
| Failure envelope | its `message`, shown as it arrives |
| Validation `400` | `fieldErrors` from its `errors` map, plus a general message |
| Bodiless `401`, `403`, `404`; network failure | a fixed text from the dictionary |

- A form shows field errors beside the fields and the general message above the submit button. An action outside a form shows a toast. Never use `alert()`.
- Unexpected exceptions (bugs) go to one global `ErrorHandler`. Do not add `try`/`catch` to hide them.

### State

- A signal lives in the component that shows it. Leaving the page discards it.
- Move it to a root `…Store` only when more than one page needs it or the hub changes it: the session, presence, the unread count, the open conversation.
- A store exposes read-only signals and the methods that change them. Nothing outside the store writes its signals.
- Use no state library.

### Components, templates and control flow

- Keep components thin. Fetching lives in `…Api` services. A rule that more than one component needs lives in a store or a pure helper.
- Section 3 applies unchanged to `…Api` services, stores, mappers and helpers: single exit, positive `if`, named booleans.
- Component event handlers, guards and interceptors play the controller's role: they may return early, checking success first.
- An event binding calls exactly one component method. Write no assignment and no second statement in a template.
- A page starts loading in `ngOnInit`. A page whose route parameter can change while it stays open loads in an `effect` that reads the input instead.
- Navigation is an `<a routerLink>`. A `<button>` is for actions.
- Leave no commented-out code and no `console.log`.

```ts
@Component({
  selector: 'app-my-profile-page',
  templateUrl: './my-profile-page.html',
  styleUrl: './my-profile-page.css',
})
export class MyProfilePage implements OnInit {
  private readonly userApi = inject(UserApi);

  protected readonly profile = signal<FullUserDto | null>(null);
  protected readonly failureMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const result = await this.userApi.getMine();

    if (result.succeeded) {
      this.profile.set(result.data);
      return;
    }

    this.failureMessage.set(result.message);
  }
}
```

### Session and auth

- The refresh token is an HttpOnly cookie that frontend code never reads. The access token lives only in memory, in `SessionStore`. Never write a token to `localStorage` or `sessionStorage`.
- Every page load restores the session by calling `POST /api/auth/refresh` before the first route activates.
- One tested function decodes the signed-in user's id, username and roles, and the token's expiry, from the access token. It must handle the claim names `nameid`, `unique_name`, `role` and `exp`; a `role` that is missing, a string or an array; and a base64url, UTF-8 payload. Decoded values decide only what the UI shows.
- One interceptor adds the `Authorization` header to `/api` calls. On a `401` from any endpoint except login and refresh, it refreshes once and retries the call once. Simultaneous `401`s share one refresh. If the refresh is refused (a `401`), it clears the session and navigates to sign-in. A refresh that gets no answer, or any other failure (offline, a `502` from the proxy, a `429`), keeps the session, so a later attempt can refresh.
- Refresh tokens rotate, so tabs take turns refreshing through the Web Locks API (`navigator.locks`).
- Calls are same-origin, so the cookie travels without `withCredentials`. Never fix a cookie problem with CORS settings (ADR 0001).

### Routing

- Every page is lazy (`loadComponent`) and names its title by dictionary key. The route table ends with a not-found route.
- There are three guards: `authGuard` (signed in), `guestGuard` (signed out, for sign-in and register) and `adminGuard`. They are a convenience for the user; the backend enforces access.
- Route parameters arrive as component inputs (`withComponentInputBinding()`), not through `ActivatedRoute` subscriptions.

### Forms

- Use typed reactive forms built with `NonNullableFormBuilder`. Never put `ngModel` or a second binding on the same control.
- Validators take their limits from `LIMITS`.
- A text box with a length limit also stops taking characters at it and shows the count: give its `<app-form-field>` `[length]` and `[maxLength]` (it draws the shared `CharacterCounter` beside the label) and the control `[attr.maxlength]`. Where a label would not fit, as in the comment box, place `<app-character-counter>` yourself. Never draw a counter of your own.
- Disable the submit button while the form is invalid, and guard the handler as well.
- Show a field's error once the field has been touched. After a failed submit, put the server's `fieldErrors` on the matching controls.

### Real-time

- One hub client in `core/` owns the connection to `/hubs/messages`. It starts after sign-in, stops on sign-out and reconnects automatically.
- On every connect it asks `SessionStore` for a valid access token, which refreshes first when the token has expired.
- It turns each server event into a store update. Components read stores and never touch the connection.
- Event names and payload types mirror `docs/backend/signalr.md`, as constants and DTO types.

### Text and languages

- The UI has a language switch. English and Georgian come first. Russian and Spanish are one file each, added later.
- All text the frontend owns comes from a dictionary: one TypeScript file per language in `core/`. English is the source and every other language is typed against it, so a missing key fails the build.
- `LanguageStore` holds the current language as a signal, remembers it in `localStorage` and exposes the current dictionary as `text()`. Templates read `text().feed.title`. Write no literal UI text in a template or component.
- An entry that needs a number or a plural form is a function. Use `Intl.PluralRules` for plurals.
- Text from the backend (failure and validation messages) is shown as it arrives, in English. Never translate it by matching strings.
- User content is never translated.

### Themes

- `ThemeStore` (`core/themes/`) holds the current theme as a signal, remembers a choice in `localStorage` and is the only app code that writes the `data-theme` marker on `<html>`. With no choice stored, the theme is the operating system's at each load.
- A script in the head of `src/index.html` repeats the store's storage key and rule, so the marker is set before the first paint. Change both together: `theme-boot.spec.ts` fails when they disagree.
- The production build does not inline critical CSS (`inlineCritical: false` in `angular.json`). Inlining keeps only rules that match the static HTML, which drops the `data-theme='dark'` block, and loads the full stylesheet without blocking the first paint, so a dark reload would paint light first.

### Dates

- The backend sends every time as UTC with a `Z` suffix. Keep times as ISO strings in DTO types and in state.
- Format them only for display, through one shared formatter that follows the current language (built on `Intl.DateTimeFormat`).
- A date of birth is a calendar date. Format it in UTC, or users west of UTC see the previous day.

### Styling

`DESIGN.md` at the repo root is the visual brief: the design tokens, their values and how to apply them. Read it before you edit a template or a style.

**Toolset**

- Tailwind v4 gives every look, and Angular CDK gives behaviour: overlays, dialogs, menus, focus trapping (ADR 0007). Install no component kit.
- Icons come from `@lucide/angular` and from nowhere else.
- Fonts are served by the app. Load nothing from another origin.

**Design tokens**

- Always write **design token** for a named styling value. A bare "token" means an access, refresh or reset token.
- A design token is named for its role (`surface-page`, `ink-strong`, `accent`), never for its shade.
- The design tokens live in the Tailwind theme block, `frontend/src/design-tokens.css`, which the build reads, and in `DESIGN.md`. Change a design token in both in the same commit. The theme block switches Tailwind's own colours, type sizes, radii, shadows and breakpoints off, so only design token classes exist.
- Write no literal colour, size or space: no hex code, no colour function such as `rgb(`, no bracketed Tailwind value (`p-[13px]`) and no inline style (`style="..."`, `[style.width.px]`). Under `src/app`, `npm run lint` fails on each of these, on a `dark:` class and on an `@apply`. It does not catch a named colour (`red`) or a `px` length in a component `.css` file, so write neither.
- Light and dark are two sets of values for the same names. A component never names a theme: write no `dark:` class.
- Until the product's name is settled, no component carries a brand metaphor. The brand lives in design token values and the logo component.

**Where styles go**

- Tailwind classes go in the template. A look that is used twice becomes a component in `shared/`.
- A shared component that dresses a native element takes an attribute selector, so the element keeps its own behaviour: `Button` is `<button appButton look="primary">` (or `quiet`, `danger`, `danger-text`), and also sits on an `<a routerLink>` that is a screen's main action.
- Never build a class with `@apply`. A component's `.css` file stays nearly empty.
- Write no global element styles beyond a reset.

**Type**

- Every font role's stack must cover Latin, Cyrillic and Georgian. The body role uses one family that covers all three; the display role may pair a Latin face with one Georgian partner.
- Do not carry meaning with capital letters. Georgian has none in everyday writing.

**Responsive**

- Fluid by default: maximum widths, never fixed widths; rows wrap; images shrink.
- Write the phone layout first. The shell changes at 768 px (`md:`).
- A page with a real second column (chat, the admin panel) may change again at 1024 px (`lg:`). No other breakpoint is used.
- Nothing scrolls sideways at 360 px. On a phone, the rows of an admin table become stacked cards.
- Check every page at 360, 768 and 1280 px, in both themes, when you build it.

**Motion and accessibility**

- Motion only answers a user's action, lasts at most 200 ms and is off under `prefers-reduced-motion`. The one exception is the "Deleting…" spinner (`DESIGN.md`, Do's and Don'ts).
- Text contrast is at least 4.5 to 1 in both themes. Keyboard focus is always visible. A touch target is at least 44 px high on a phone.

**Profile pictures**

- One `Avatar` component in `shared/` shows a user's profile picture everywhere. Without a picture it draws the default: the user's initials on a disc.
- The disc's colour is one of the eight disc design tokens, chosen by the user's id. A username in two parts gives both first letters; any other gives its first two letters. An unavailable account gets the grey disc with no letters.

**When a design skill and these documents disagree**

- Neither wins automatically. Report the conflict with both arguments, and the owner decides on the merits.
- If the skill's advice is taken, change the document, so every page follows it. Never follow the skill on one page only.
- When the owner is away, follow the document and record the conflict in the ticket.

### Tests and linting

- Write Vitest unit tests for code with logic and no template: `…Api` services, `toAppResult`, the token decoder, the refresh flow, guards and pure helpers. Name them as in section 11.
- **Temporary (until the 2026-11-25 release):** write no component DOM tests and no end-to-end tests; verify pages by running the app. Afterwards, a few end-to-end flows come first.
- ESLint runs the rules `ng add angular-eslint` sets up (recommended, stylistic, template accessibility) plus three: no un-awaited promises (`@typescript-eslint/no-floating-promises`), no `any` (`@typescript-eslint/no-explicit-any`) and design tokens only (`webcity/design-tokens-only`, in `frontend/eslint-rules/`, which reads templates, component styles and component classes, and whose own tests `npm run lint` runs). Prettier owns formatting.
- Lint, tests and build run in the existing CI workflow.

## 11. Tests

```ts
describe("GET /api/posts/feed", () => {
  it("returns 401 without a token", async () => { ... });
  it("shows accepted friends' posts only", async () => { ... });
});
```
