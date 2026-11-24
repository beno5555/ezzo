import { defineConfig } from 'vitest/config';

// Read by Angular's unit-test builder through `runnerConfig` in angular.json. The builder owns the
// test file list, the environment and isolation (off, which is the fast setting).
// Shuffled run: VITEST_SHUFFLE=1 npm test -- --watch=false
const shuffle = process.env['VITEST_SHUFFLE'] === '1';

export default defineConfig({
  test: {
    sequence: { shuffle },
  },
});
