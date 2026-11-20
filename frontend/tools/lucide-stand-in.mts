import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const lucidePackage = '@lucide/angular';
const standInId = '\0lucide-stand-in';
const sourceExtension = '.ts';
const lucideImportPattern = /import\s*\{([^}]*)\}\s*from\s*'@lucide\/angular'/g;

function findSourceFiles(folder: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    const isTypeScriptFile = entry.name.endsWith(sourceExtension);

    if (entry.isDirectory()) {
      files.push(...findSourceFiles(path));
    } else if (isTypeScriptFile) {
      files.push(path);
    }
  }

  return files;
}

// The names in one `import { LucideX, LucideY as Alias } from '@lucide/angular'`, as the package exports them.
function readImportedNames(importedList: string): string[] {
  const names: string[] = [];

  for (const item of importedList.split(',')) {
    const exportedName = item.trim().split(/\s+as\s+/)[0];
    const isName = exportedName !== '';

    if (isName) {
      names.push(exportedName);
    }
  }

  return names;
}

// The icons the app imports, read from its own source, so a new icon needs no list to edit.
function findImportedIcons(sourceRoot: string): string[] {
  const icons = new Set<string>();

  for (const file of findSourceFiles(sourceRoot)) {
    for (const match of readFileSync(file, 'utf8').matchAll(lucideImportPattern)) {
      readImportedNames(match[1]).forEach((name) => icons.add(name));
    }
  }

  return [...icons];
}

// A module with one empty component per imported icon, under the real selector (`svg[lucideX]`).
function buildStandIn(sourceRoot: string): string {
  const lines = [`import { Component } from '@angular/core';`];

  for (const icon of findImportedIcons(sourceRoot)) {
    const attribute = icon.charAt(0).toLowerCase() + icon.slice(1);
    lines.push(
      `export const ${icon} = Component({ selector: 'svg[${attribute}]', template: '' })(class ${icon} {});`,
    );
  }

  return lines.join('\n');
}

/**
 * Serves the unit tests a stand-in for `@lucide/angular`.
 *
 * The package ships about two thousand icon components in partial-compiled form, and the unit-test
 * builder loads node_modules as-is, so Angular compiles every one of them in the browser when the
 * package is first imported: about 12 s for each worker, most of a full run. No spec reads an
 * icon's drawing, so the tests get empty `<svg>` elements instead. A build (`npm run build`) still
 * fails on an icon the package lacks.
 */
export function lucideStandIn(sourceRoot: string): Plugin {
  return {
    name: 'webcity:lucide-stand-in',
    enforce: 'pre',
    resolveId(id) {
      const isLucide = id === lucidePackage;
      let resolved: string | undefined;

      if (isLucide) {
        resolved = standInId;
      }

      return resolved;
    },
    load(id) {
      const isStandIn = id === standInId;
      let source: string | undefined;

      if (isStandIn) {
        source = buildStandIn(sourceRoot);
      }

      return source;
    },
  };
}
