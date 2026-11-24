namespace aspnetproject.Infrastructure.Queries;

// Today by UTC unless a date is given: the date lets a missed day be run again.
public class BirthdayListQuery : PageQuery
{
    public DateOnly? Date { get; set; }
}
