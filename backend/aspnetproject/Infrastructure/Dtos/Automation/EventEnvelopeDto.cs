namespace aspnetproject.Infrastructure.Dtos.Automation;

// What every event sent to the automation looks like. Data is typed as object so it is written with its own shape.
public class EventEnvelopeDto
{
    public Guid     Id         { get; set; }
    public string   Event      { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }

    public object Data { get; set; } = new();
}
