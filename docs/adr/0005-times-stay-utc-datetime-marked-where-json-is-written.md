# Times stay UTC `DateTime` and are marked as UTC where JSON is written

Ezzo stores every time as UTC in `datetime2` columns, which carry no zone. A value read back from such a column no longer knows it is UTC, so .NET writes it to JSON without the `Z` suffix, and a browser reads a time without a suffix as local time. We keep `DateTime` and fix this once, at the JSON boundary: a converter writes every `DateTime` as UTC with the `Z`, for controller responses and hub payloads alike (`UtcDateTimeJsonConverter`, `AddUtcTimeJson()`; `docs/backend/data.md`, Times).

## Considered Options

- **`DateTimeOffset` everywhere**: rejected. It means a migration over every date column, plus every entity, DTO, seed and test, to store an offset that would always be `+00:00`. It is the right choice only when the local time of an event must be remembered, which Ezzo never needs.
- **An EF Core value converter that marks values as UTC when they are read**: rejected, because the chat list is read with raw SQL into a plain projection, which entity converters do not touch.
- **Appending the `Z` in the frontend**: rejected, because every date on every screen, and every hub payload, would then depend on a rule being remembered.

## Consequences

- The converter labels values as UTC; it does not shift them. A local time written by mistake would be labeled wrongly, so the rule that all code writes UTC stays essential.
- The frontend does not compensate. It formats what it receives.
- A date of birth is a calendar date stored as a time. The frontend formats it in UTC, or users west of UTC would see the previous day.
