import { HttpContextToken } from '@angular/common/http';

// Set on the calls whose 401 must not lead to a refresh and a retry: sign-in, and the refresh itself.
export const SKIP_RENEWAL = new HttpContextToken<boolean>(() => false);
