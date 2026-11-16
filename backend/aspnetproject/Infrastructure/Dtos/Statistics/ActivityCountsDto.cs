namespace aspnetproject.Infrastructure.Dtos.Statistics;

// How many rows of each kind were created inside one window.
public class ActivityCountsDto
{
    public int Accounts { get; set; }
    public int Posts    { get; set; }
    public int Comments { get; set; }
    public int Messages { get; set; }
}
