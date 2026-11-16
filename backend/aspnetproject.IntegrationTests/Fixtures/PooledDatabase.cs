using Respawn;

namespace aspnetproject.IntegrationTests.Fixtures;

// One migrated database of the run's pool, with the Respawner that wipes it.
public record PooledDatabase(string Name, string ConnectionString, Respawner Respawner);
