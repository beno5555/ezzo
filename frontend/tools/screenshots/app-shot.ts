import type { AppLoad } from './app-load.ts';

// One image of an app address: a load at one width.
export type AppShot = AppLoad & { width: number };
