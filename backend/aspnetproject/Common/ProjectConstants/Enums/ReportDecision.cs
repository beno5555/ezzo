namespace aspnetproject.Common.ProjectConstants.Enums;

// An administrator's answer to a pending report. Never stored: hiding makes the report Resolved, rejecting makes it Rejected.
// Numbering starts at 1 so that an unset value is never a real decision.
public enum ReportDecision
{
    Hide = 1,
    Reject
}
