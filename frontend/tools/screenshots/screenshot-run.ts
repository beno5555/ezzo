import type { LoginDto } from '../../src/app/features/auth/login-dto.ts';
import type { ScreenshotRequest } from './screenshot-request.ts';

// A request that is ready to run: the servers answer, and a signed-in run has its credentials (null for a guest).
export type ScreenshotRun = ScreenshotRequest & { credentials: LoginDto | null };
