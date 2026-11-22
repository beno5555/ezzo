// Constants.cs's BytesPerMegabyte.
const bytesPerMegabyte = 1024 * 1024;

// The backend's limits, mirrored by hand. Each group names the backend file it copies.
export const LIMITS = {
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs. The age is counted on the UTC calendar, as
  // Common/Attributes/DataValidation/ValidAgeAttribute.cs counts it.
  users: {
    usernameMinLength: 3,
    usernameMaxLength: 100,
    emailMinLength: 10,
    emailMaxLength: 100,
    passwordMinLength: 6,
    passwordMaxLength: 100,
    bioMinLength: 1,
    bioMaxLength: 300,
    minAge: 13,
    maxAge: 100,
    usernamePattern: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/,
    emailPattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  },
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs (CreatePostDto)
  posts: {
    titleMaxLength: 100,
    contentMaxLength: 3000,
  },
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs (CreateCommentDto and EditCommentDto)
  comments: {
    contentMaxLength: 500,
  },
  // The defaults of backend/aspnetproject/Infrastructure/Services/Storage/Configuration/
  // ImageStorageConfiguration.cs, and the formats ImageStorage accepts (it judges a file by its leading
  // bytes; the browser can only go by the type it reads from the name).
  images: {
    bytesPerMegabyte,
    maxFileSizeBytes: 5 * bytesPerMegabyte,
    maxPerPost: 10,
    maxPerMessage: 5,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs, the bounds of Infrastructure/Queries/PageQuery.cs
  paging: {
    firstPageNumber: 1,
    defaultPageSize: 10,
    maxPageSize: 100,
  },
} as const;
