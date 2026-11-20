// Builds the WebCity C4 diagrams: one SVG per diagram in this folder, and a PNG of each when Playwright is installed.
// Run from the repo root: node docs/c4/diagrams/build.mjs
// Every position is set by hand. Moving an element means moving the ends of its arrows too.

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boundary, element, legend, relation, render } from './c4.mjs';
import { codeDiagram } from './code-diagram.mjs';
import { apiInfrastructure, apiRequests, spaComponents } from './components.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DATE = 'November 2026';

// ---------------------------------------------------------------------------------------------------------------
// Level 1: System Context
// ---------------------------------------------------------------------------------------------------------------

function systemContext() {
  const user = element({
    kind: 'person', shape: 'person', x: 500, y: 40, w: 220, h: 200,
    name: 'User', type: 'Person',
    description: 'A signed-in member. Posts, comments, likes, befriends people and messages friends.',
  });
  const admin = element({
    kind: 'person', shape: 'person', x: 920, y: 40, w: 220, h: 200,
    name: 'Administrator', type: 'Person',
    description: 'A user with the Administrator role. Manages accounts, moderates content, decides reports.',
  });
  const guest = element({
    kind: 'person', shape: 'person', x: 80, y: 700, w: 220, h: 200,
    name: 'Guest', type: 'Person',
    description: 'A visitor who is not signed in. Finds people and reads what they have published.',
  });
  const developer = element({
    kind: 'person', shape: 'person', x: 920, y: 700, w: 220, h: 200,
    name: 'Developer', type: 'Person',
    description: 'Builds and runs WebCity. Is told at once when the server fails.',
  });
  const webcity = element({
    kind: 'system', x: 455, y: 380, w: 310, h: 170,
    name: 'WebCity', type: 'Software System',
    description: 'A small social platform: posts with photos, comments, likes, friendships, direct messages, presence, reports and an admin panel.',
  });
  const email = element({
    kind: 'external', x: 60, y: 385, w: 260, h: 160,
    name: 'Email System', type: 'Software System, external',
    description: 'An SMTP mail service. Delivers WebCity\'s emails to people\'s inboxes.',
  });
  const telegram = element({
    kind: 'external', x: 900, y: 385, w: 260, h: 160,
    name: 'Telegram', type: 'Software System, external',
    description: 'Messenger. Delivers alerts to the administrators\' and the developers\' chats.',
  });
  const openai = element({
    kind: 'external', x: 480, y: 720, w: 260, h: 160,
    name: 'OpenAI Moderation API', type: 'Software System, external',
    description: 'Scores text and images for content that breaks the rules.',
  });

  const relations = [
    relation([user.bottom(), webcity.top()], 'Posts, comments, befriends people and messages friends using', null, { label: [610, 312] }),
    relation([admin.bottom(-50), webcity.top(130)], 'Manages accounts and moderates content using', null, { label: [858, 300], labelWidth: 150 }),
    relation([[300, 790], webcity.bottom(-110)], 'Reads profiles and posts using', null, { label: [400, 645], labelWidth: 130 }),
    relation([webcity.left(), email.right()], 'Sends emails using', null, { labelWidth: 110 }),
    relation([email.top(40), user.left(10)], 'Delivers emails to', null, { label: [370, 300], labelWidth: 110 }),
    relation([webcity.right(), telegram.left()], 'Sends alerts using', null, { labelWidth: 110 }),
    relation([telegram.top(30), admin.bottom(30)], 'Delivers moderation and report alerts to', null, { label: [1060, 312], labelWidth: 130 }),
    relation([telegram.bottom(30), developer.top(30)], 'Delivers exception alerts to', null, { label: [1060, 620], labelWidth: 130 }),
    relation([webcity.bottom(), openai.top()], 'Checks posts, comments and photos using', null, { label: [610, 635], labelWidth: 150 }),
  ];

  const key = legend(
    [
      { kind: 'person', shape: 'person', name: 'Person' },
      { kind: 'system', name: 'Software System' },
      { kind: 'external', name: 'Software System, external' },
      { kind: 'relation' },
    ],
    60, 960,
  );

  return render({
    width: 1200, height: 1140,
    title: '[System Context] WebCity',
    subtitle: `The system context diagram for WebCity. ${DATE}.`,
    elements: [user, admin, guest, developer, webcity, email, telegram, openai, ...key.elements],
    relations: [...relations, ...key.relations],
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Level 2: Containers
// ---------------------------------------------------------------------------------------------------------------

function containers() {
  const user = element({
    kind: 'person', shape: 'person', x: 380, y: 30, w: 220, h: 200,
    name: 'User', type: 'Person',
    description: 'A guest or a signed-in member of WebCity.',
  });
  const admin = element({
    kind: 'person', shape: 'person', x: 740, y: 30, w: 220, h: 200,
    name: 'Administrator', type: 'Person',
    description: 'A user with the Administrator role.',
  });
  const web = element({
    kind: 'container', x: 70, y: 330, w: 270, h: 170,
    name: 'Web Server', type: 'Container: nginx; the Angular dev server in development',
    description: 'Serves the SPA\'s files and forwards /api and /hubs to the API, so the browser sees one origin.',
  });
  const spa = element({
    kind: 'container', shape: 'browser', x: 480, y: 320, w: 300, h: 190,
    name: 'Single-Page Application', type: 'Container: TypeScript, Angular 22, Tailwind CSS',
    description: 'Every page of WebCity in the browser: feed, profiles, friends, chat, settings and the admin panel.',
  });
  const api = element({
    kind: 'container', x: 480, y: 610, w: 300, h: 180,
    name: 'API Application', type: 'Container: C#, ASP.NET Core Web API, .NET 10',
    description: 'The REST API under /api, the SignalR hub at /hubs/messages, and the background cleanup jobs.',
  });
  const automation = element({
    kind: 'container', x: 930, y: 610, w: 230, h: 180,
    name: 'Automation', type: 'Container: n8n 2.47 in Docker',
    description: 'Six workflows: AI moderation, report handling, welcome email, weekly digest, birthdays, exception alerts.',
  });
  const database = element({
    kind: 'container', shape: 'database', x: 70, y: 860, w: 270, h: 190,
    name: 'Database', type: 'Container: SQL Server, EF Core code-first',
    description: 'Users, roles, posts, comments, likes, friendships, messages, reports, refresh token hashes, log rows.',
  });
  const files = element({
    kind: 'container', shape: 'folder', x: 480, y: 880, w: 300, h: 160,
    name: 'File Storage', type: 'Container: server file system',
    description: 'Uploaded photos of posts and messages (Uploads/), and the error log file (Logs/).',
  });
  const openai = element({
    kind: 'external', x: 1270, y: 330, w: 250, h: 150,
    name: 'OpenAI Moderation API', type: 'Software System, external',
    description: 'Scores text and images for rule-breaking content.',
  });
  const telegram = element({
    kind: 'external', x: 1270, y: 610, w: 250, h: 150,
    name: 'Telegram', type: 'Software System, external',
    description: 'Delivers alerts to the administrators\' and the developers\' chats.',
  });
  const email = element({
    kind: 'external', x: 1270, y: 880, w: 250, h: 150,
    name: 'Email System', type: 'Software System, external',
    description: 'An SMTP mail service.',
  });

  const relations = [
    relation([user.bottom(), spa.top(-60)], 'Uses', 'HTTPS', { label: [535, 272], labelWidth: 60 }),
    relation([admin.bottom(), spa.top(70)], 'Uses the admin panel in', 'HTTPS', { label: [770, 272], labelWidth: 110 }),
    relation([web.right(-10), spa.left(-15)], 'Delivers the SPA\'s files to the browser', null, { label: [410, 392], labelWidth: 120 }),
    relation([spa.bottom(), api.top()], 'Makes API calls to, and receives live events from', 'JSON/HTTPS, SignalR over WebSocket, through the web server', { label: [630, 558], labelWidth: 230 }),
    relation([web.bottom(-20), [185, 700], api.left(-5)], 'Forwards /api and /hubs to', 'HTTPS, WebSocket', { label: [345, 700], labelWidth: 140 }),
    relation([api.left(60), [420, 760], [420, 955], database.right()], 'Reads from and writes to', 'EF Core, SQL over TCP', { label: [410, 830], labelWidth: 120 }),
    relation([api.bottom(-40), files.top(-40)], 'Saves, serves and deletes photos in; writes errors to', 'File I/O', { label: [610, 836], labelWidth: 210 }),
    relation([api.right(-40), automation.left(-40)], 'Sends signed events to', 'JSON/HTTP webhooks, HMAC-SHA256', { label: [855, 640], labelWidth: 130 }),
    relation([automation.left(45), api.right(45)], 'Calls the internal and moderation endpoints, downloads photos', 'JSON/HTTPS, API key', { label: [855, 752], labelWidth: 130 }),
    relation([automation.top(), [1045, 405], openai.left()], 'Checks text and photos using', 'JSON/HTTPS', { label: [1150, 405], labelWidth: 110 }),
    relation([[1160, 685], [1270, 685]], 'Sends alerts using', 'Bot API, HTTPS', { label: [1215, 650], labelWidth: 90 }),
    relation([automation.bottom(), [1045, 935], email.left(-20)], 'Sends welcome, digest, birthday and moderation emails using', 'SMTP', { label: [1150, 912], labelWidth: 150 }),
    relation([api.bottom(100), [730, 855], [850, 855], [850, 1005], email.left(50)], 'Sends account security emails using', 'SMTP, MailKit', { label: [1050, 1005], labelWidth: 200 }),
  ];

  const key = legend(
    [
      { kind: 'person', shape: 'person', name: 'Person' },
      { kind: 'container', name: 'Container' },
      { kind: 'container', shape: 'browser', name: 'Container, web browser' },
      { kind: 'container', shape: 'database', name: 'Container, database' },
      { kind: 'container', shape: 'folder', name: 'Container, file system' },
      { kind: 'external', name: 'Software System, external' },
      { kind: 'relation' },
    ],
    40, 1150,
  );

  return render({
    width: 1560, height: 1330,
    title: '[Container] WebCity',
    subtitle: `The container diagram for WebCity. ${DATE}.`,
    boundaries: [boundary(30, 285, 1160, 820, 'WebCity', 'Software System')],
    elements: [user, admin, web, spa, api, automation, database, files, openai, telegram, email, ...key.elements],
    relations: [...relations, ...key.relations],
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------------------------------------------

const diagrams = {
  '1-system-context': systemContext(),
  '2-containers': containers(),
  '3a-components-api-requests': apiRequests(),
  '3b-components-api-infrastructure': apiInfrastructure(),
  '3c-components-spa': spaComponents(),
  '4-code-create-post': codeDiagram(),
};

for (const [name, svg] of Object.entries(diagrams)) {
  writeFileSync(join(here, `${name}.svg`), svg);
}

// PNGs for documents that cannot embed SVG. Playwright is optional: without it, only the SVGs are written.
let chromium = null;
try {
  chromium = createRequire(import.meta.url)('playwright').chromium;
} catch {
  console.log('Playwright not found: wrote the SVGs only.');
}
if (chromium) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const [name, svg] of Object.entries(diagrams)) {
    const [, width, height] = svg.match(/width="(\d+)" height="(\d+)"/);
    await page.setViewportSize({ width: Number(width), height: Number(height) });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: join(here, `${name}.png`), clip: { x: 0, y: 0, width: Number(width), height: Number(height) } });
  }
  await browser.close();
}
console.log(`Wrote ${Object.keys(diagrams).length} diagrams to ${here}`);
