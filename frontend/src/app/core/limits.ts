// The backend's limits, mirrored by hand. Each group names the backend file it copies.
export const LIMITS = {
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs
  users: {
    usernameMaxLength: 100,
    passwordMinLength: 6,
    passwordMaxLength: 100,
  },
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs, the bounds of Infrastructure/Queries/PageQuery.cs
  paging: {
    firstPageNumber: 1,
    defaultPageSize: 10,
    maxPageSize: 100,
  },
} as const;
