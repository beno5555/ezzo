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
    // Constants.UsernameChangeCooldownDays: a username can change once in this many days.
    usernameChangeCooldownDays: 20,
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
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs (CreateReportDto)
  reports: {
    reasonMaxLength: 500,
  },
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs (CreateMessageDto, and EditMessageWindow, the
  // 20 minutes after sending in which the sender may edit a message)
  messages: {
    contentMaxLength: 1000,
    editWindowMilliseconds: 20 * 60 * 1000,
  },
  // backend/aspnetproject/Common/ProjectConstants/Constants.cs (LogQueryDto's action and entity name; a
  // row's user and entity ids are the backend's int, which ends at 2^31 - 1)
  logs: {
    actionMaxLength: 100,
    entityNameMaxLength: 50,
    maxId: 2_147_483_647,
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
