// Level 3: the component diagrams. The API Application is drawn as two views of the same container,
// one for request handling and one for its infrastructure, because one picture of both crossed every line.

import { boundary, element, legend, relation, render } from './c4.mjs';

const DATE = 'November 2026';

function component(x, y, w, h, name, technology, description) {
  return element({
    kind: 'component', x, y, w, h, name,
    type: `Component: ${technology}`,
    description,
  });
}

const componentLegend = (x, y, extra = []) =>
  legend(
    [
      ...extra,
      { kind: 'component', name: 'Component' },
      { kind: 'container', name: 'Container' },
      { kind: 'container', shape: 'database', name: 'Container, database' },
      { kind: 'relation' },
    ],
    x, y,
  );

// ---------------------------------------------------------------------------------------------------------------
// 3a. API Application: how a request is handled
// ---------------------------------------------------------------------------------------------------------------

export function apiRequests() {
  const L = [40, 320, 600, 880, 1160, 1440];
  const W = 220;
  const R1 = 300;
  const R2 = 610;

  const spa = element({
    kind: 'container', shape: 'browser', x: 270, y: 30, w: 320, h: 160,
    name: 'Single-Page Application', type: 'Container: TypeScript, Angular',
    description: 'Every page of WebCity in the browser.',
  });
  const automation = element({
    kind: 'container', x: 1110, y: 30, w: 260, h: 160,
    name: 'Automation', type: 'Container: n8n',
    description: 'The six workflows.',
  });

  const userControllers = component(L[0], R1, W, 160, 'User controllers', 'ASP.NET Core controllers',
    'Auth, users, friendships, account deactivation, reactivation and deletion.');
  const contentControllers = component(L[1], R1, W, 160, 'Content controllers', 'ASP.NET Core controllers',
    'Posts and their photos, likes, comments, messages, reports.');
  const hub = component(L[2], R1, W, 160, 'MessageHub', 'SignalR hub, /hubs/messages',
    'Keeps one group per user, tracks connections, receives SendTyping.');
  const adminController = component(L[3], R1, W, 160, 'Admin controllers', 'ASP.NET Core controllers',
    'AdminController: logs, statistics, accounts, the moderation queue. ModerationController: moderation status.');
  const internalController = component(L[4], R1, W, 160, 'Internal controller', 'ASP.NET Core controller',
    'InternalController: digest list, birthday list and notifications, for the automation only.');
  const jobs = component(L[5], R1, W, 160, 'Background jobs', 'Hosted services',
    'Delete expired refresh tokens, purge soft-deleted users, old log rows and orphaned photos; reset presence at startup.');

  const userServices = component(L[0], R2, W, 160, 'User services', 'C# services',
    'AuthService, UserService, FriendshipService, AccountManagementService, AccountActivationService.');
  const contentServices = component(L[1], R2, W, 160, 'Content services', 'C# services',
    'PostService, PostLikeService, CommentService, MessageService, ReportService, ModerationService.');
  const realtime = component(L[2], R2, W, 160, 'Real-time services', 'C# services, singleton tracker',
    'PresenceService, TypingService, UserConnectionTracker.');
  const adminServices = component(L[3], R2, W, 160, 'Admin services', 'C# services',
    'LogService, StatisticsService.');
  const internalServices = component(L[4], R2, W, 160, 'Internal services', 'C# services',
    'DigestService, BirthdayService, NotificationService: the lists, and notifications pushed through IHubContext.');

  const repositories = component(40, 880, 1620, 90, 'Repositories', 'EF Core, BaseRepository<T>, BaseEntityRepository<T>',
    'One class per aggregate. Shared paging and transactions over one scoped ApplicationDbContext.');
  const database = element({
    kind: 'container', shape: 'database', x: 700, y: 1110, w: 300, h: 160,
    name: 'Database', type: 'Container: SQL Server',
    description: 'All of WebCity\'s data.',
  });

  const down = (from, to, label, technology, options = {}) =>
    relation([from.bottom(options.dx ?? 0), to.top(options.dx ?? 0)], label, technology, options);

  const relations = [
    relation([spa.bottom(-120), userControllers.top(30)], 'Calls', 'JSON/HTTPS', { label: [222, 245], labelWidth: 80 }),
    relation([spa.bottom(-20), contentControllers.top(20)], 'Calls', 'JSON/HTTPS', { label: [440, 245], labelWidth: 80 }),
    relation([spa.bottom(90), hub.top(-20)], 'Connects to', 'SignalR, WebSocket', { label: [630, 245], labelWidth: 100 }),
    relation([spa.right(20), adminController.top(-50)], 'Calls', 'JSON/HTTPS', { label: [850, 232], labelWidth: 80 }),
    relation([automation.bottom(-60), adminController.top(60)], 'Sets moderation status through', 'JSON/HTTPS, API key', { label: [1040, 245], labelWidth: 120 }),
    relation([automation.bottom(60), internalController.top(-30)], 'Calls', 'JSON/HTTPS, API key', { label: [1255, 250], labelWidth: 90 }),

    down(userControllers, userServices, 'Use', null, { label: [150, 535] }),
    down(contentControllers, contentServices, 'Use', null, { label: [430, 535] }),
    relation([hub.bottom(-60), realtime.top(-60)], 'Hands connections and typing to', null, { label: [662, 515], labelWidth: 80 }),
    relation([realtime.top(60), hub.bottom(60)], 'Pushes presence and typing through', 'IHubContext', { label: [770, 560], labelWidth: 95 }),
    relation([contentServices.right(-40), hub.left(30)], 'Pushes messages, comments and likes through', 'IHubContext', { label: [578, 590], labelWidth: 68 }),
    down(adminController, adminServices, 'Use', null, { label: [990, 535] }),
    down(internalController, internalServices, 'Use', null, { label: [1270, 535] }),
    relation([adminServices.left(40), realtime.right(40)], 'Reads the online count from', null, { label: [850, 735], labelWidth: 55 }),

    relation([userServices.bottom(), [userServices.cx, 880]], 'Read and write through', null, { label: [150, 825], labelWidth: 90 }),
    relation([contentServices.bottom(), [contentServices.cx, 880]], 'Read and write through', null, { label: [430, 825], labelWidth: 90 }),
    relation([realtime.bottom(), [realtime.cx, 880]], 'Store presence through', null, { label: [710, 825], labelWidth: 90 }),
    relation([adminServices.bottom(), [adminServices.cx, 880]], 'Count and page through', null, { label: [990, 825], labelWidth: 90 }),
    relation([internalServices.bottom(), [internalServices.cx, 880]], 'Read through', null, { label: [1270, 825], labelWidth: 90 }),
    relation([jobs.bottom(), [jobs.cx, 880]], 'Delete old rows through', null, { label: [1550, 700], labelWidth: 90 }),
    relation([repositories.bottom(0), database.top(0)], 'Reads from and writes to', 'EF Core, SQL over TCP', { label: [850, 1065], labelWidth: 160 }),
  ];
  // The content services' push runs from their right side up to the hub's left side.
  relations[10].points = [contentServices.right(-40), [580, contentServices.cy - 40], [580, hub.cy + 30], hub.left(30)];

  const key = componentLegend(40, 1320);

  return render({
    width: 1700, height: 1500,
    title: '[Component] WebCity - API Application: request handling',
    subtitle: `Controllers, the hub and the services, and how they reach the data. ${DATE}.`,
    boundaries: [boundary(20, 260, 1660, 800, 'API Application', 'Container: C#, ASP.NET Core Web API')],
    elements: [spa, automation, userControllers, contentControllers, hub, adminController, internalController, jobs,
      userServices, contentServices, realtime, adminServices, internalServices, repositories, database, ...key.elements],
    relations: [...relations, ...key.relations],
  });
}

// ---------------------------------------------------------------------------------------------------------------
// 3b. API Application: infrastructure
// ---------------------------------------------------------------------------------------------------------------

export function apiInfrastructure() {
  const A = 40;
  const B = 330;
  const C = 620;
  const D = 910;
  const E = 1200;
  const W = 240;

  const emailSystem = element({
    kind: 'external', x: A, y: 30, w: W, h: 140,
    name: 'Email System', type: 'Software System, external',
    description: 'An SMTP mail service.',
  });
  const automation = element({
    kind: 'container', x: C, y: 30, w: W, h: 140,
    name: 'Automation', type: 'Container: n8n',
    description: 'Receives the events at /webhook/{event name}.',
  });

  const emailSender = component(A, 290, W, 150, 'Email sender', 'MailKit',
    'Sends the account security emails: password reset, reactivation, deactivation, password-changed and sign-up notices.');
  const userServices = component(B, 290, W, 150, 'User services', 'C# services',
    'Registration, password reset, deactivation, reactivation, deletion.');
  const exceptionHandler = component(D, 290, W, 150, 'Global exception handler', 'IExceptionHandler',
    'Turns an unhandled exception into the failure envelope and reports it.');
  const loggers = component(E, 290, W, 150, 'Loggers', 'DatabaseLogger, SystemLogger',
    'Outcome rows in the Log table; unhandled exceptions and failed log writes in a file.');
  const eventPublisher = component(C, 455, W, 150, 'Event publisher', 'Typed HttpClient, HMAC-SHA256',
    'Wraps, signs and posts one event in one awaited attempt; logs a failure and never throws.');
  const contentServices = component(B, 620, W, 150, 'Content services', 'C# services',
    'Posts with photos, messages with photos, comments, reports.');
  const jobs = component(D, 620, W, 150, 'Background jobs', 'Hosted services on PeriodicHostedService',
    'Cleanup cycles on a timer. A failed cycle is logged and reported.');
  const imageStorage = component(B, 860, W, 150, 'Image storage', 'C# class, static files at /api/images',
    'Checks uploads by their leading bytes, names, saves and deletes files. The only code that touches them.');

  const files = element({
    kind: 'container', shape: 'folder', x: B, y: 1110, w: 330, h: 140,
    name: 'File Storage', type: 'Container: server file system',
    description: 'Uploads/ and Logs/.',
  });
  const database = element({
    kind: 'container', shape: 'database', x: E, y: 1110, w: W, h: 150,
    name: 'Database', type: 'Container: SQL Server',
    description: 'The Log table among the rest.',
  });

  const relations = [
    relation([userServices.left(), emailSender.right()], 'Send emails with', null, { labelWidth: 50 }),
    relation([emailSender.top(), emailSystem.bottom()], 'Sends emails using', 'SMTP', { label: [A + W / 2, 230], labelWidth: 120 }),
    relation([userServices.bottom(), [B + W / 2, eventPublisher.cy - 30], eventPublisher.left(-30)], 'Publish account-created with', null, { label: [535, 497], labelWidth: 150 }),
    relation([contentServices.top(), [B + W / 2, eventPublisher.cy + 30], eventPublisher.left(30)], 'Publish post, comment and report events with', null, { label: [535, 568], labelWidth: 150 }),
    relation([exceptionHandler.bottom(), [D + W / 2, eventPublisher.cy - 30], eventPublisher.right(-30)], 'Publishes exception-occurred with', null, { label: [945, 497], labelWidth: 150 }),
    relation([jobs.top(), [D + W / 2, eventPublisher.cy + 30], eventPublisher.right(30)], 'Publish a failed cycle with', null, { label: [945, 568], labelWidth: 150 }),
    relation([eventPublisher.top(), automation.bottom()], 'Sends signed events to', 'JSON/HTTP webhooks, X-WebCity-Signature', { label: [740, 230], labelWidth: 150 }),
    relation([exceptionHandler.right(), loggers.left()], 'Logs to', null, { labelWidth: 50 }),
    relation([jobs.right(-30), [1260, jobs.cy - 30], loggers.bottom(-60)], 'Log each cycle with', null, { label: [1260, 545], labelWidth: 80 }),
    relation([contentServices.bottom(), imageStorage.top()], 'Check, save and delete photos with', null, { label: [450, 815], labelWidth: 120 }),
    relation([jobs.bottom(), [D + W / 2, 935], imageStorage.right()], 'Delete orphaned photos with', null, { label: [790, 935], labelWidth: 120 }),
    relation([imageStorage.bottom(), files.top(-45)], 'Writes, reads and deletes photos in', 'File I/O', { label: [450, 1060], labelWidth: 140 }),
    relation([loggers.bottom(30), database.top(30)], 'Writes Log rows to', 'EF Core', { label: [1350, 800], labelWidth: 90 }),
    relation([loggers.right(), [1480, 365], [1480, 1290], [files.cx + 100, 1290], files.bottom(100)], 'Appends unhandled exceptions to', 'File I/O, Logs/ErrorLogs.txt', { label: [1000, 1290], labelWidth: 230 }),
  ];

  const key = legend(
    [
      { kind: 'component', name: 'Component' },
      { kind: 'container', name: 'Container' },
      { kind: 'container', shape: 'folder', name: 'Container, file system' },
      { kind: 'external', name: 'Software System, external' },
      { kind: 'relation' },
    ],
    40, 1340,
  );

  return render({
    width: 1520, height: 1520,
    title: '[Component] WebCity - API Application: infrastructure',
    subtitle: `Email, events, photos and logs: the components that reach outside the process. ${DATE}.`,
    boundaries: [boundary(20, 250, 1440, 810, 'API Application', 'Container: C#, ASP.NET Core Web API')],
    elements: [emailSystem, automation, emailSender, userServices, exceptionHandler, loggers, eventPublisher,
      contentServices, jobs, imageStorage, files, database, ...key.elements],
    relations: [...relations, ...key.relations],
  });
}

// ---------------------------------------------------------------------------------------------------------------
// 3c. Single-Page Application
// ---------------------------------------------------------------------------------------------------------------

export function spaComponents() {
  const L = [40, 330, 620, 910];
  const W = 240;

  const user = element({
    kind: 'person', shape: 'person', x: 430, y: 20, w: 220, h: 190,
    name: 'User', type: 'Person',
    description: 'A guest, a member or an administrator.',
  });

  const shell = component(L[0], 300, W, 160, 'Shell', 'Angular components',
    'Top bar, bottom bar, search box, user menu, language and theme switches.');
  const routing = component(L[1], 300, W, 160, 'Routing and guards', 'Angular Router',
    'Lazy-loads each page; authGuard, guestGuard and adminGuard; page titles.');
  const pages = component(L[2], 300, W, 160, 'Feature pages', 'Angular standalone components',
    'Auth pages, feed, user search; profile, friends, chat, settings and admin pages as they are built.');
  const shared = component(L[3], 300, W, 160, 'Shared UI', 'Angular components, Tailwind CSS, Angular CDK',
    'Buttons, form fields, dialog, confirmation, menu, toasts, post card, photos, avatar.');

  const languages = component(L[0], 570, W, 160, 'Languages and themes', 'Signals, dictionaries',
    'English and Georgian dictionaries, plural forms, dates; light and dark theme.');
  const session = component(L[1], 570, W, 160, 'Session store', 'Signals, Web Locks',
    'The signed-in user and the access token, in memory only; restores the session by refresh.');
  const apis = component(L[2], 570, W, 160, 'API services', 'HttpClient',
    'AuthApi, UserApi, PostApi, PostLikeApi, FriendshipApi, MessageApi, AccountActivationApi. Return promises of results.');
  const stores = component(L[3], 570, W, 160, 'Feature stores', 'Signals',
    'Presence, unread count, incoming requests, likes, toasts; PagedList for every paged list.');

  const interceptor = component(L[2], 840, W, 150, 'Auth interceptor', 'HttpInterceptorFn',
    'Adds the access token; on a 401 refreshes once, shared, and retries.');
  const hubClient = component(L[3], 840, W, 150, 'Hub client', '@microsoft/signalr, loaded on demand',
    'One connection while signed in; maps each hub event to a store method.');

  const api = element({
    kind: 'container', x: 620, y: 1090, w: 530, h: 130,
    name: 'API Application', type: 'Container: C#, ASP.NET Core Web API',
    description: 'Reached through the web server at /api and /hubs.',
  });

  const relations = [
    relation([user.left(40), shell.top(40)], 'Navigates with', null, { label: [230, 245], labelWidth: 90 }),
    relation([user.right(40), pages.top(20)], 'Reads and acts on', null, { label: [745, 245], labelWidth: 90 }),
    relation([shell.right(), routing.left()], 'Navigates through', null, { labelWidth: 45 }),
    relation([routing.right(), pages.left()], 'Lazy-loads', null, { labelWidth: 45 }),
    relation([pages.right(), shared.left()], 'Are built from', null, { labelWidth: 45 }),
    relation([shell.bottom(), languages.top()], 'Switches language and theme with', null, { label: [160, 515], labelWidth: 140 }),
    relation([routing.bottom(), session.top()], 'Guards read the session from', null, { label: [450, 515], labelWidth: 120 }),
    relation([pages.bottom(-40), apis.top(-40)], 'Call', null, { label: [700, 515], labelWidth: 50 }),
    relation([pages.bottom(60), stores.top(-60)], 'Read and update', null, { label: [865, 515], labelWidth: 60 }),
    relation([stores.left(), apis.right()], 'Read through', null, { labelWidth: 45 }),
    relation([session.right(-30), apis.left(-30)], 'Signs in and refreshes through', null, { label: [595, 590], labelWidth: 45 }),
    relation([apis.bottom(), interceptor.top()], 'Send requests through', null, { label: [740, 785], labelWidth: 100 }),
    relation([interceptor.left(-20), [L[1] + W / 2, 895], session.bottom()], 'Reads the token from, refreshes through', null, { label: [450, 790], labelWidth: 110 }),
    relation([hubClient.top(), stores.bottom()], 'Feeds live events into', null, { label: [1030, 785], labelWidth: 100 }),
    relation([interceptor.bottom(), [740, 1090]], 'Sends requests to', 'JSON/HTTPS, /api', { label: [740, 1040], labelWidth: 120 }),
    relation([hubClient.bottom(), [1030, 1090]], 'Connects to', 'SignalR over WebSocket, /hubs/messages', { label: [1030, 1040], labelWidth: 140 }),
  ];

  const key = legend(
    [
      { kind: 'person', shape: 'person', name: 'Person' },
      { kind: 'component', name: 'Component' },
      { kind: 'container', name: 'Container' },
      { kind: 'relation' },
    ],
    40, 1290,
  );

  return render({
    width: 1200, height: 1470,
    title: '[Component] WebCity - Single-Page Application',
    subtitle: `The Angular application's parts. Pages not built yet load a placeholder. ${DATE}.`,
    boundaries: [boundary(20, 260, 1160, 790, 'Single-Page Application', 'Container: TypeScript, Angular 22')],
    elements: [user, shell, routing, pages, shared, languages, session, apis, stores, interceptor, hubClient, api, ...key.elements],
    relations: [...relations, ...key.relations],
  });
}
