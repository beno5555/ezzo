// Level 4: a UML class diagram of the code behind one component path, creating a post
// (PostController -> PostService -> PostRepository, ImageStorage, EventPublisher). Names are the real ones.

import { textWidth } from './c4.mjs';

const FONT = 'Arial, Helvetica, FreeSans, sans-serif';
const LINE = 17;
const LINE_COLOR = '#555555';

function escape(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// A class box: a header (stereotype and name), attributes, operations. Its height follows its members.
function umlClass(spec) {
  const c = { attributes: [], operations: [], stereotype: null, abstract: false, ...spec };
  const header = (c.stereotype ? LINE : 0) + 26;
  c.h = header + 8 + Math.max(c.attributes.length, 0.4) * LINE + 8 + Math.max(c.operations.length, 0.4) * LINE + 4;
  c.header = header;
  c.cx = c.x + c.w / 2;
  c.cy = c.y + c.h / 2;
  c.top = (dx = 0) => [c.cx + dx, c.y];
  c.bottom = (dx = 0) => [c.cx + dx, c.y + c.h];
  c.left = (dy = 0) => [c.x, c.cy + dy];
  c.right = (dy = 0) => [c.x + c.w, c.cy + dy];
  return c;
}

function drawClass(c) {
  const parts = [
    `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="#FFFFFF" stroke="#333333" stroke-width="1.3"/>`,
    `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.header}" fill="#E8F1FB" stroke="#333333" stroke-width="1.3"/>`,
  ];
  let y = c.y + 18;
  if (c.stereotype) {
    parts.push(`<text x="${c.cx}" y="${y}" font-family="${FONT}" font-size="11" fill="#444" text-anchor="middle">${escape(`«${c.stereotype}»`)}</text>`);
    y += LINE;
  }
  parts.push(
    `<text x="${c.cx}" y="${y}" font-family="${FONT}" font-size="14" font-weight="bold" fill="#111" text-anchor="middle"` +
      `${c.abstract ? ' font-style="italic"' : ''}>${escape(c.name)}</text>`,
  );
  y = c.y + c.header + 8;
  for (const a of c.attributes) {
    parts.push(`<text x="${c.x + 8}" y="${y + 12}" font-family="${FONT}" font-size="12" fill="#222">${escape(a)}</text>`);
    y += LINE;
  }
  if (!c.attributes.length) y += 0.4 * LINE;
  y += 8;
  parts.push(`<line x1="${c.x}" y1="${y - 4}" x2="${c.x + c.w}" y2="${y - 4}" stroke="#333333" stroke-width="1"/>`);
  for (const o of c.operations) {
    parts.push(`<text x="${c.x + 8}" y="${y + 12}" font-family="${FONT}" font-size="12" fill="#222">${escape(o)}</text>`);
    y += LINE;
  }
  return parts.join('\n');
}

// kind: 'extends' (solid, hollow triangle), 'uses' (dashed, open arrow), 'composition' (solid, filled diamond at the start).
function link(points, kind, label = null, options = {}) {
  return { points, kind, label, ...options };
}

function drawLink(l) {
  const d = l.points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const dash = l.kind === 'uses' ? ' stroke-dasharray="6 4"' : '';
  const end = l.kind === 'extends' ? ' marker-end="url(#triangle)"' : l.kind === 'uses' ? ' marker-end="url(#open)"' : '';
  const start = l.kind === 'composition' ? ' marker-start="url(#diamond)"' : '';
  const parts = [`<path d="${d}" fill="none" stroke="${LINE_COLOR}" stroke-width="1.3"${dash}${end}${start}/>`];
  if (l.label) {
    const [lx, ly] = l.at;
    const w = textWidth(l.label, 11.5) + 8;
    parts.push(
      `<rect x="${lx - w / 2}" y="${ly - 11}" width="${w}" height="16" fill="#FFFFFF" fill-opacity="0.95"/>`,
      `<text x="${lx}" y="${ly + 1}" font-family="${FONT}" font-size="11.5" fill="#333" text-anchor="middle">${escape(l.label)}</text>`,
    );
  }
  for (const [text, [x, y]] of l.ends ?? []) {
    parts.push(`<text x="${x}" y="${y}" font-family="${FONT}" font-size="11.5" fill="#333" text-anchor="middle">${escape(text)}</text>`);
  }
  return parts.join('\n');
}

function packageFrame(x, y, w, h, name) {
  const tab = textWidth(name, 12, true) + 20;
  return [
    `<rect x="${x}" y="${y}" width="${tab}" height="20" fill="#F4F4F4" stroke="#888" stroke-width="1"/>`,
    `<text x="${x + 10}" y="${y + 14}" font-family="${FONT}" font-size="12" font-weight="bold" fill="#333">${escape(name)}</text>`,
    `<rect x="${x}" y="${y + 20}" width="${w}" height="${h - 20}" fill="none" stroke="#888" stroke-width="1"/>`,
  ].join('\n');
}

export function codeDiagram() {
  const baseController = umlClass({
    x: 60, y: 70, w: 330, name: 'BaseController', abstract: true, stereotype: 'abstract',
    operations: ['# GetUserId(): int', '# GetOptionalUserId(): int?', '# GetUsername(): string', '# IsAdministrator(): bool'],
  });
  const postController = umlClass({
    x: 60, y: 330, w: 330, name: 'PostController',
    attributes: ['- _postService: PostService'],
    operations: [
      '+ CreatePost(CreatePostDto): ActionResult',
      '+ GetFeed(PageQuery): ActionResult',
      '+ GetPostById(int): ActionResult',
      '+ UpdatePost(int, UpdatePostDto): ActionResult',
      '+ DeletePost(int): ActionResult',
      '+ RemovePostImage(int, int): ActionResult',
    ],
  });
  const baseService = umlClass({
    x: 500, y: 70, w: 420, name: 'BaseService',
    attributes: ['- _dbLogger: DatabaseLogger', '- _serviceName: string'],
    operations: ['# LogResultAsync(succeeded, method, entityName, details, entityId): Task'],
  });
  const postService = umlClass({
    x: 500, y: 330, w: 420, name: 'PostService',
    attributes: [
      '- _postRepository: PostRepository',
      '- _imageStorage: ImageStorage',
      '- _eventPublisher: EventPublisher',
      '- _userRepository, _commentRepository',
    ],
    operations: [
      '+ UploadPost(userId, CreatePostDto): Task<ApplicationResponse<…>>',
      '+ GetFeedAsync(userId, isAdmin, page, size): Task<ListResponse<…>>',
      '+ UpdatePost(id, userId, isAdmin, UpdatePostDto)',
      '+ DeletePostAsync(callerId, isAdmin, id)',
      '+ RemovePostImageAsync(postId, imageId, callerId, isAdmin)',
      '- CheckNewPostAsync(userId, CreatePostDto)',
    ],
  });
  const response = umlClass({
    x: 1030, y: 70, w: 300, name: 'ApplicationResponse',
    attributes: ['+ Succeeded: bool', '+ Message: string?'],
    operations: ['+ Ok(message)', '+ Fail(message)'],
  });
  const responseOfT = umlClass({
    x: 1030, y: 330, w: 300, name: 'ApplicationResponse<T>',
    attributes: ['+ Data: T?'],
    operations: ['+ Ok(T data, message)', '+ Fail(message)'],
  });

  const postRepository = umlClass({
    x: 60, y: 720, w: 400, name: 'PostRepository',
    operations: [
      '+ AddPostAsync(Post): Task<Post>',
      '+ GetFeedAsync(callerId, isAdmin, page, size)',
      '+ GetPostByIdAsync(id, callerId, isAdmin)',
      '+ SetModerationStatusAsync(id, ModerationStatus)',
      '# Query(track): IQueryable<Post>',
    ],
  });
  const baseEntityRepository = umlClass({
    x: 60, y: 975, w: 400, name: 'BaseEntityRepository<T : BaseEntity>',
    operations: ['+ GetByIdAsync(int): Task<T?>', '+ ExistsByIdAsync(int): Task<bool>', '+ CountAsync(): Task<int>'],
  });
  const baseRepository = umlClass({
    x: 60, y: 1180, w: 400, name: 'BaseRepository<T>',
    attributes: ['# _dbContext: ApplicationDbContext', '# _dbSet: DbSet<T>'],
    operations: [
      '+ AddAsync(T): Task',
      '+ ExecuteInTransactionAsync(operation): Task',
      '+ SaveChangesAsync(): Task',
      '# Page(query, page, size): IQueryable<T>',
      '# Query(track): IQueryable<T>',
    ],
  });

  const imageStorage = umlClass({
    x: 520, y: 720, w: 400, name: 'ImageStorage',
    operations: [
      '+ CheckPostImagesAsync(files): Task<ApplicationResponse<…>>',
      '+ SaveWithOwnerAsync<TOwner>(images, addOwnerAsync)',
      '+ DeleteAsync(addresses): Task<int>',
      '- DetectExtensionAsync(IFormFile): Task<string?>',
    ],
  });
  const checkedImage = umlClass({
    x: 600, y: 975, w: 240, name: 'CheckedImage', stereotype: 'record',
    attributes: ['+ File: IFormFile', '+ Extension: string'],
  });
  const eventPublisher = umlClass({
    x: 1000, y: 560, w: 330, name: 'EventPublisher',
    operations: ['+ PublishAsync(eventName, data): Task', '- SendAsync(eventName, data)', '- Sign(byte[]): string'],
  });
  const postMapper = umlClass({
    x: 1000, y: 760, w: 330, name: 'PostMapper', stereotype: 'static',
    operations: ['+ ToEntity(userId, dto, imageAddresses): Post', '+ ToNewPostDisplay(Post)', '+ ToFullDisplay(projection)'],
  });

  const post = umlClass({
    x: 1000, y: 985, w: 330, name: 'Post',
    attributes: [
      '+ PostTitle: string',
      '+ PostContent: string',
      '+ ModerationStatus: ModerationStatus',
      '+ UserId: int',
      '+ Images: ICollection<PostImage>',
      '+ IsHidden: bool  {not mapped}',
    ],
  });
  const baseEntity = umlClass({
    x: 600, y: 1250, w: 260, name: 'BaseEntity',
    attributes: ['+ Id: int', '+ CreatedAt: DateTime', '+ LastUpdatedAt: DateTime?'],
  });
  const baseImage = umlClass({
    x: 1060, y: 1390, w: 230, name: 'BaseImage', abstract: true, stereotype: 'abstract',
    attributes: ['+ Address: string', '+ OrderIndex: int'],
  });
  const postImage = umlClass({
    x: 1420, y: 1215, w: 200, name: 'PostImage',
    attributes: ['+ PostId: int', '+ Post: Post?'],
  });

  const links = [
    link([postController.top(), baseController.bottom()], 'extends'),
    link([postService.top(), baseService.bottom()], 'extends'),
    link([responseOfT.top(), response.bottom()], 'extends'),
    link([postController.right(-60), postService.left(-60)], 'uses', 'uses', { at: [445, postController.cy - 60] }),
    link([postService.right(-80), responseOfT.left(-20)], 'uses', 'returns', { at: [975, postService.cy - 50] }),
    link([postService.bottom(-150), [postService.x + 60, 680], [postRepository.cx, 680], postRepository.top()], 'uses', 'uses', { at: [400, 680] }),
    link([postService.bottom(-30), imageStorage.top(10)], 'uses', 'uses', { at: [720, 690] }),
    link([postService.right(70), [960, postService.cy + 70], [960, eventPublisher.cy], eventPublisher.left()], 'uses', 'uses', { at: [960, 600] }),
    link([postService.bottom(150), [860, 690], [1165, 690], postMapper.top()], 'uses', 'uses', { at: [1165, 690] }),
    link([postRepository.bottom(), baseEntityRepository.top()], 'extends', '«bind» T → Post', { at: [300, 948] }),
    link([baseEntityRepository.bottom(), baseRepository.top()], 'extends'),
    link([imageStorage.bottom(-20), checkedImage.top(-20)], 'uses', 'checks uploads into', { at: [700, 948] }),
    link([postMapper.bottom(), post.top()], 'uses', 'creates', { at: [1165, 962] }),
    link([postRepository.right(70), [490, postRepository.cy + 70], [490, 1120], [980, 1120], [980, post.cy + 40], post.left(40)], 'uses', 'stores', { at: [740, 1120] }),
    link([post.bottom(-60), [1105, 1215], [730, 1215], baseEntity.top()], 'extends'),
    link([baseImage.left(), [baseEntity.cx, baseImage.cy], baseEntity.bottom()], 'extends'),
    link([postImage.bottom(), [postImage.cx, baseImage.cy], baseImage.right()], 'extends'),
    link([post.right(40), [postImage.cx, post.cy + 40], postImage.top()], 'composition', null, {
      ends: [['1', [1352, post.cy + 32]], ['0..10  Images', [1560, 1205]]],
    }),
  ];

  const classes = [baseController, postController, baseService, postService, response, responseOfT, postRepository,
    baseEntityRepository, baseRepository, imageStorage, checkedImage, eventPublisher, postMapper, post, baseEntity,
    baseImage, postImage];

  const width = 1680;
  const height = 1610;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<defs>',
    `<marker id="triangle" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="13" markerHeight="13" orient="auto-start-reverse"><path d="M0,0 L12,6 L0,12 z" fill="#FFFFFF" stroke="${LINE_COLOR}" stroke-width="1.2"/></marker>`,
    `<marker id="open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10" fill="none" stroke="${LINE_COLOR}" stroke-width="1.4"/></marker>`,
    `<marker id="diamond" viewBox="0 0 16 10" refX="1" refY="5" markerWidth="16" markerHeight="10" orient="auto"><path d="M0,5 L8,0 L16,5 L8,10 z" fill="${LINE_COLOR}"/></marker>`,
    '</defs>',
    `<rect width="${width}" height="${height}" fill="#FFFFFF"/>`,
    packageFrame(30, 20, 1620, 1500, 'aspnetproject: creating a post'),
    ...links.map((l) => drawLink(l).split('\n')[0]),
    ...classes.map(drawClass),
    ...links.map((l) => drawLink(l).split('\n').slice(1).join('\n')),
    `<text x="30" y="${height - 50}" font-family="${FONT}" font-size="20" fill="#2E2E2E">[Code] WebCity - API Application: creating a post</text>`,
    `<text x="30" y="${height - 28}" font-family="${FONT}" font-size="12" fill="#8A8A8A">UML class diagram. Solid line with a hollow triangle: inherits; dashed line: uses; filled diamond: owns. November 2026.</text>`,
    '</svg>',
  ].join('\n');
}
