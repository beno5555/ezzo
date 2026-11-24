namespace aspnetproject.Common.ProjectConstants.Enums;

// What a notification from the automation is about; it decides the shape of its data. Written as BIRTHDAY on the wire
// (NotificationKindJsonConverter). Numbering starts at 1 so that an unset value is never a real kind.
public enum NotificationKind
{
    Birthday = 1
}
