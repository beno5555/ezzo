import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { lucideStandIn } from './tools/lucide-stand-in.mts';

// Read by Angular's unit-test builder through `runnerConfig` in angular.json. The builder owns the
// test file list, the environment and isolation (off, which is the fast setting), so this file holds
// only what it does not: the icon stand-in and a switch for a shuffled run.
// Shuffled run: VITEST_SHUFFLE=1 npm test -- --watch=false
const shuffle = process.env['VITEST_SHUFFLE'] === '1';

export default defineConfig({
  plugins: [lucideStandIn(fileURLToPath(new URL('./src', import.meta.url)))],
  test: {
    sequence: { shuffle },
  },
});
