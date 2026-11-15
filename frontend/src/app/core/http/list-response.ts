import { ApplicationResponse } from './application-response';

// The backend's list envelope (Common/Domain/ListResponse.cs), which extends ApplicationResponse.
export type ListResponse<T> = ApplicationResponse<T[]> & { totalCount: number };
