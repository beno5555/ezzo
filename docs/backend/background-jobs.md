# Ezzo — Background Jobs

## `PeriodicHostedService` (base class)

Each `PeriodicTimer` tick calls `RunOnceAsync`, which creates a scope and passes its service provider to `RunCycleAsync`. All services resolved within the cycle share that scope. A failed cycle is [logged](#logging-from-background-jobs) and the timer can continue. See [PeriodicHostedService.cs](../../backend/aspnetproject/Infrastructure/Services/BackgroundJobs/Base/PeriodicHostedService.cs).

The four cleanup jobs are registered as hosted services and read their settings from `CleanupConfiguration`. See [ApplicationServicesExtensions.cs](../../backend/aspnetproject/Extensions/ApplicationServicesExtensions.cs).

---

## Testing a job

`CustomWebApplicationFactory` removes every `IHostedService` registration, so no timer runs in a test and a job registered only through `AddHostedService<T>()` cannot be resolved at all. A job that has tests is registered twice:

```csharp
services.AddSingleton<OrphanImagesCleanupService>();
services.AddHostedService(serviceProvider => serviceProvider.GetRequiredService<OrphanImagesCleanupService>());
```

The singleton remains available after the test host removes the hosted-service entry. `OrphanImagesCleanupService` and `SoftDeletedUsersCleanupService` use this registration. A test resolves the job from the host and runs one cycle.

```csharp
var job = _factory.Services.GetRequiredService<OrphanImagesCleanupService>();
await job.RunOnceAsync(CancellationToken.None);
```

Assert on the files or database rows the cycle should change. For a cycle that should do nothing, also assert that it wrote no job log rows. See the [background-job tests](../../backend/aspnetproject.IntegrationTests/BackgroundJobs).

---

## `RefreshTokenCleanupService`

Config: `RefreshTokenCleanupConfiguration` — `Interval` (default 1 hour), `BatchSize` (default 500).

Repeatedly batch-deletes (`RefreshTokenRepository.DeleteExpiredAsync`) rows matching `ExpiresAt < utcNow && RevokedAt != null`, looping until a batch returns zero, logging the total removed if any were.

---

## `OldLogsCleanupService`

Config: `OldLogsCleanupConfiguration` — `Interval` (default 1 day), `RetentionDays` (default 90), `BatchSize` (default 1000).

Same batch-and-loop shape (`LogRepository.DeleteLogsAsync`) against `Log` rows older than the retention cutoff.

---

## `SoftDeletedUsersCleanupService`

Config: `SoftDeletedUsersCleanupConfiguration` — `Interval` (default 24 hours), `RetentionDays` (default 20), `BatchSize` (default 300, top-level user batch), `NestedBatchSize` (default 1000, per-dependency batch).

The job purges users whose `AccountDeletedAt` is older than the retention cutoff. `DeleteSoftDeletedUsersBatchAsync` bypasses the global user filter when selecting and deleting those users. Before deleting a batch of users, it deletes their messages, friendships, posts, likes on other posts, and reports they made, in that order. It then clears `ReviewedByUserId` on reports they decided, preserving `ReviewedAt`. Each dependent step selects up to `NestedBatchSize` IDs at a time and repeats the bulk delete or update until it affects zero rows. Their comments on surviving posts lose the author reference through `SetNull`. See [foreign-key cascade rules](data.md#fk-cascade-behavior) and [UserRepository.cs](../../backend/aspnetproject/Data/Repositories/UserRepository.cs).

The repository reads photo addresses before deleting their message and post rows. After the database batch, the job passes the addresses to `ImageStorage.DeleteAsync` for best-effort file cleanup. It repeats until there are no more users to purge or cancellation is requested, and logs the totals once if it removed any users.

---

## `OrphanImagesCleanupService`

Config: `OrphanImagesCleanupConfiguration` (section `CleanupConfiguration:OrphanImages`, every key optional): `Interval` (default 24 hours), `MinimumAge` (default 1 hour, at least one minute), `BatchSize` (default 500).

The backstop for photo files that no row points at. They are left behind when the process crashes between writing the files and saving their post or message, when a best-effort delete fails (removing a friendship, the purge above, deleting a message or a post, removing a post's photo) or when the purge stops partway through a batch. The immediate cleanup paths stay: `ImageStorage.SaveWithOwnerAsync` removes the files when saving the owner throws, and each database delete removes its files afterwards. This job catches what those miss.

Each sweep:
1. Takes the cutoff `UtcNow - MinimumAge` and asks `ImageStorage.ListImageAddressesWrittenBefore(cutoff)` for the addresses of the files last written before it. Only files directly in the upload folder whose names `ImageStorage` makes (`{guid}` in `N` format plus `.jpg`, `.png` or `.webp`) count; anything else in the folder, subfolders included, is left alone. A missing folder lists nothing.
2. Splits the addresses into batches of `BatchSize`. For each batch, `ImageRepository.GetReferencedAddressesAsync` returns the ones a `PostImages` or `MessageImages` row still holds (one `UNION` query), and the rest go to `ImageStorage.DeleteAsync`, which returns how many files it removed. A file that cannot be removed is logged to `SystemLogger` and the sweep goes on.
3. Writes one `Log` row (`EntityName` `BaseImage`) with the number of files removed, only if it removed any.

**Why `MinimumAge`.** An upload writes the file before it saves the row that refers to it. The age threshold gives the database write time to complete. The sweep takes the cutoff once and compares it with each file's last write time. Startup rejects a `MinimumAge` under one minute with an `OptionsValidationException`.

`ImageStorage` stays the only code that lists or deletes uploaded files; the job only decides which ones.

Tests: `OrphanImagesCleanupServiceTests` (see **Testing a job**) cover deleting an old unreferenced file, keeping old files that a post's or a message's photo refers to, keeping a young unreferenced file, leaving files with other names alone, a missing upload folder, the `Log` row with and without removals, and a host that refuses to start with a `MinimumAge` under one minute. A file that cannot be deleted is not tested here: a held file blocks deletion on Windows but not on Linux, so the test could not run the same on both. `PostControllerTests` test that case another way, with a folder in the file's place, which no platform deletes as a file.

---

## Logging from background jobs

Background jobs log through `DatabaseLogger.LogSystemActionAsync`, not `LogUserActionAsync` — no `HttpContext`/caller identity exists in a timer-triggered cycle, so `AuthorizedRequest` is always `false` and `UserId` is always `null` for these rows, distinguishing them from request-triggered log rows at a glance.

Job rows use the action `{JobName}.RunCycleAsync`. On failure, the base class logs `Succeeded = false` with no entity name, then publishes an [`exception-occurred` event](automation.md#exception-occurred) when events are enabled. `LogDetails.FitToColumn` caps the exception text at the column size. If the database log write fails, `DatabaseLogger` falls back to `SystemLogger`.
