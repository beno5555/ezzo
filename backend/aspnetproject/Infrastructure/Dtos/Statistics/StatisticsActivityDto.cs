namespace aspnetproject.Infrastructure.Dtos.Statistics;

// The 30-day counts include the 7-day ones: both windows end now.
public class StatisticsActivityDto
{
    public ActivityCountsDto Last7Days  { get; set; } = new();
    public ActivityCountsDto Last30Days { get; set; } = new();
}
