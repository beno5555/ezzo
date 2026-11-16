namespace aspnetproject.Infrastructure.Services.Helpers.Configuration;

// HashIterations: PBKDF2 rounds for every password hashed or checked. Stored hashes do not record their iteration count,
// so a lowered value would weaken every new password and lock out every existing one. Startup therefore fails below
// MinimumIterations in every environment except Testing, where the test host lowers it to keep sign-ins cheap.
public class PasswordHashingConfiguration
{
    public const int    MinimumIterations       = 100_000;
    public const string TestingEnvironment      = "Testing";
    public const string IterationsTooLowMessage =
        "PasswordConfiguration:HashIterations must be at least 100000 outside the Testing environment.";

    public int HashIterations { get; set; } = MinimumIterations;

    public bool HasSafeIterationsFor(IHostEnvironment environment)
    {
        bool isTesting    = environment.IsEnvironment(TestingEnvironment);
        bool meetsMinimum = HashIterations >= MinimumIterations;

        return isTesting || meetsMinimum;
    }
}
