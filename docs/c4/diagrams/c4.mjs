// A small SVG drawing kit for C4 diagrams, in the colours of the Structurizr C4 theme the academy's template uses.
// No dependencies: build.mjs places every element and arrow by hand and calls render().

const FONT = 'Arial, Helvetica, FreeSans, sans-serif';

const COLORS = {
  person: { fill: '#08427B', stroke: '#052E56', text: '#FFFFFF' },
  system: { fill: '#1168BD', stroke: '#0B4884', text: '#FFFFFF' },
  container: { fill: '#438DD5', stroke: '#2E6295', text: '#FFFFFF' },
  component: { fill: '#85BBF0', stroke: '#5D82A8', text: '#000000' },
  external: { fill: '#999999', stroke: '#6B6B6B', text: '#FFFFFF' },
  externalPerson: { fill: '#686868', stroke: '#4D4D4D', text: '#FFFFFF' },
};

const RELATION_COLOR = '#707070';

// Helvetica advance widths (1/1000 em) for printable ASCII; close enough to Arial to wrap text before it is drawn.
const WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667,
  556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556,
  556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722,
  500, 500, 500, 334, 260, 334, 584,
];

export function textWidth(text, size, bold = false) {
  let units = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    units += code >= 32 && code <= 126 ? WIDTHS[code - 32] : 600;
  }
  return (units / 1000) * size * (bold ? 1.1 : 1.0);
}

export function wrap(text, size, maxWidth, bold = false) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, size, bold) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function escape(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function textBlock(lines, x, y, size, options = {}) {
  const { weight = 'normal', color = '#000', anchor = 'middle', lineHeight = size * 1.25, style = '' } = options;
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${(y + i * lineHeight).toFixed(1)}" font-family="${FONT}" font-size="${size}" ` +
        `font-weight="${weight}" fill="${color}" text-anchor="${anchor}"${style ? ` font-style="${style}"` : ''}>` +
        `${escape(line)}</text>`,
    )
    .join('\n');
}

// An element: a person, a software system, a container or a component. kind picks the colour,
// shape picks the outline (box, person, database, browser), planned draws a dashed outline.
export function element(spec) {
  const e = { shape: 'box', planned: false, ...spec };
  e.cx = e.x + e.w / 2;
  e.cy = e.y + e.h / 2;
  e.top = (dx = 0) => [e.cx + dx, e.y];
  e.bottom = (dx = 0) => [e.cx + dx, e.y + e.h];
  e.left = (dy = 0) => [e.x, e.cy + dy];
  e.right = (dy = 0) => [e.x + e.w, e.cy + dy];
  return e;
}

function drawElement(e) {
  const c = COLORS[e.kind];
  const dash = e.planned ? ' stroke-dasharray="7 4"' : '';
  const parts = [];
  let textTop = e.y;
  let textHeight = e.h;

  if (e.shape === 'person') {
    const r = Math.min(e.w * 0.2, 42);
    const headCy = e.y + r;
    const bodyY = e.y + r * 1.75;
    parts.push(
      `<rect x="${e.x}" y="${bodyY}" width="${e.w}" height="${e.y + e.h - bodyY}" rx="${r * 0.9}" ` +
        `fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${dash}/>`,
      `<circle cx="${e.cx}" cy="${headCy}" r="${r}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${dash}/>`,
    );
    textTop = bodyY + 4;
    textHeight = e.y + e.h - bodyY - 4;
  } else if (e.shape === 'database') {
    const ry = 14;
    parts.push(
      `<path d="M${e.x},${e.y + ry} A${e.w / 2},${ry} 0 0 1 ${e.x + e.w},${e.y + ry} V${e.y + e.h - ry} ` +
        `A${e.w / 2},${ry} 0 0 1 ${e.x},${e.y + e.h - ry} Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${dash}/>`,
      `<path d="M${e.x},${e.y + ry} A${e.w / 2},${ry} 0 0 0 ${e.x + e.w},${e.y + ry}" fill="none" ` +
        `stroke="${c.stroke}" stroke-width="1.5"/>`,
    );
    textTop = e.y + ry * 2;
    textHeight = e.h - ry * 3;
  } else if (e.shape === 'browser') {
    parts.push(
      `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="8" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${dash}/>`,
      `<line x1="${e.x}" y1="${e.y + 18}" x2="${e.x + e.w}" y2="${e.y + 18}" stroke="${c.stroke}" stroke-width="1.5"/>`,
      ...[0, 1, 2].map(
        (i) => `<circle cx="${e.x + 12 + i * 11}" cy="${e.y + 9}" r="3.2" fill="${c.stroke}"/>`,
      ),
    );
    textTop = e.y + 18;
    textHeight = e.h - 18;
  } else if (e.shape === 'folder') {
    const tab = Math.min(90, e.w * 0.4);
    parts.push(
      `<path d="M${e.x},${e.y + 14} V${e.y + 4} Q${e.x},${e.y} ${e.x + 4},${e.y} H${e.x + tab - 10} L${e.x + tab},${e.y + 14} ` +
        `H${e.x + e.w - 4} Q${e.x + e.w},${e.y + 14} ${e.x + e.w},${e.y + 18} V${e.y + e.h - 4} Q${e.x + e.w},${e.y + e.h} ` +
        `${e.x + e.w - 4},${e.y + e.h} H${e.x + 4} Q${e.x},${e.y + e.h} ${e.x},${e.y + e.h - 4} Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${dash}/>`,
    );
    textTop = e.y + 14;
    textHeight = e.h - 14;
  } else {
    parts.push(
      `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="6" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"${dash}/>`,
    );
  }

  const inner = e.w - 20;
  const nameLines = wrap(e.name, 16, inner, true);
  const typeLines = e.type ? wrap(`[${e.type}]`, 11, inner) : [];
  const descLines = e.description ? wrap(e.description, 12, inner) : [];
  const height = nameLines.length * 19 + typeLines.length * 14 + (descLines.length ? 8 + descLines.length * 15 : 0);
  let y = textTop + (textHeight - height) / 2 + 14;
  parts.push(textBlock(nameLines, e.cx, y, 16, { weight: 'bold', color: c.text, lineHeight: 19 }));
  y += nameLines.length * 19 - 2;
  parts.push(textBlock(typeLines, e.cx, y, 11, { color: c.text, lineHeight: 14 }));
  y += typeLines.length * 14 + (typeLines.length ? 8 : 0);
  if (descLines.length) {
    parts.push(textBlock(descLines, e.cx, y, 12, { color: c.text, lineHeight: 15 }));
  }
  return parts.join('\n');
}

// A relationship: a dashed polyline from the first point to the last, with an arrowhead at the end.
// label: [x, y] places the description's centre; it defaults to the middle of the longest segment.
export function relation(points, description, technology, options = {}) {
  return { points, description, technology, ...options };
}

function drawRelation(r) {
  const d = r.points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const parts = [
    `<path d="${d}" fill="none" stroke="${RELATION_COLOR}" stroke-width="1.5" stroke-dasharray="7 5" marker-end="url(#arrow)"/>`,
  ];

  let [lx, ly] = r.label ?? [];
  if (lx === undefined) {
    let best = 0;
    for (let i = 1; i < r.points.length; i++) {
      const [ax, ay] = r.points[i - 1];
      const [bx, by] = r.points[i];
      const length = Math.hypot(bx - ax, by - ay);
      if (length > best) {
        best = length;
        lx = (ax + bx) / 2;
        ly = (ay + by) / 2;
      }
    }
  }

  const width = r.labelWidth ?? 170;
  const descLines = wrap(r.description, 12, width);
  const techLines = r.technology ? wrap(`[${r.technology}]`, 10.5, width) : [];
  const height = descLines.length * 14 + techLines.length * 13;
  const boxWidth = Math.max(...[...descLines.map((l) => textWidth(l, 12)), ...techLines.map((l) => textWidth(l, 10.5))]);
  const top = ly - height / 2;
  parts.push(
    `<rect x="${(lx - boxWidth / 2 - 4).toFixed(1)}" y="${(top - 2).toFixed(1)}" width="${(boxWidth + 8).toFixed(1)}" ` +
      `height="${(height + 4).toFixed(1)}" fill="#FFFFFF" fill-opacity="0.92"/>`,
    textBlock(descLines, lx, top + 11, 12, { color: '#3A3A3A', lineHeight: 14 }),
    textBlock(techLines, lx, top + descLines.length * 14 + 10, 10.5, { color: '#707070', lineHeight: 13 }),
  );
  return parts.join('\n');
}

// A dashed boundary around the elements of one software system or container, named at its bottom left.
export function boundary(x, y, w, h, name, type) {
  return { x, y, w, h, name, type };
}

function drawBoundary(b) {
  return [
    `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="none" stroke="#7A7A7A" stroke-width="1.5" stroke-dasharray="9 5"/>`,
    textBlock([b.name], b.x + 12, b.y + b.h - 24, 15, { weight: 'bold', color: '#2E2E2E', anchor: 'start' }),
    textBlock([`[${b.type}]`], b.x + 12, b.y + b.h - 9, 11, { color: '#5A5A5A', anchor: 'start' }),
  ].join('\n');
}

// Draws the whole diagram: boundaries first, then arrows, then elements, so elements cover arrow ends neatly,
// and labels last so no line runs through one. title and subtitle go under the drawing, as in Structurizr.
export function render({ width, height, title, subtitle, elements, relations, boundaries = [] }) {
  const relParts = relations.map(drawRelation);
  const lines = relParts.map((p) => p.split('\n')[0]);
  const labels = relParts.map((p) => p.split('\n').slice(1).join('\n'));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">` +
      `<path d="M0,0 L10,5 L0,10 z" fill="${RELATION_COLOR}"/></marker></defs>`,
    `<rect width="${width}" height="${height}" fill="#FFFFFF"/>`,
    ...boundaries.map(drawBoundary),
    ...lines,
    ...elements.map(drawElement),
    ...labels,
    textBlock([title], 30, height - 40, 20, { color: '#2E2E2E', anchor: 'start' }),
    textBlock([subtitle], 30, height - 18, 12, { color: '#8A8A8A', anchor: 'start' }),
    '</svg>',
  ].join('\n');
}

// The key under each diagram: one small sample of every shape and colour the diagram uses.
export function legend(items, x, y) {
  const elements = [];
  const relations = [];
  let cursor = x;
  for (const item of items) {
    if (item.kind === 'relation') {
      relations.push(relation([[cursor, y + 45], [cursor + 110, y + 45]], 'Relationship', null, { label: [cursor + 55, y + 70], labelWidth: 120 }));
      cursor += 140;
    } else {
      const w = item.shape === 'person' ? 120 : 150;
      elements.push(element({ ...item, x: cursor, y, w, h: 90 }));
      cursor += w + 20;
    }
  }
  return { elements, relations };
}
