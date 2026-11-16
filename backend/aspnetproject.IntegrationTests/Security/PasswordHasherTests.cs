using System.Security.Cryptography;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Helpers.Configuration;
using Microsoft.Extensions.Options;

namespace aspnetproject.IntegrationTests.Security;

// The hasher with no setting, as every environment but Testing runs it. Stored hashes do not record their iteration
// count, so the default must stay exactly what it was before the setting existed.
public class PasswordHasherTests
{
    // "password123" hashed at 100,000 iterations before the setting existed (the suite's old seed hash).
    private const string LegacyPassword = "password123";
    private const string LegacyHash     = "x3UgoGJFZ2X3VJBAaQyF4J+M9+gfXP6vdO1W4jNwUzQ=";
    private const string LegacySalt     = "o0wzhm224CIRy46p73NmiqjhaEtU5pyOuZ60rUHOM+g=";

    private const int HashLength = 32;

    private readonly PasswordHasher _hasher = new(Options.Create(new PasswordHashingConfiguration()));

    [Fact]
    public void PasswordsMatch_WithDefaultSettingAndHashStoredBeforeTheSetting_ReturnsTrue()
    {
        bool matches = _hasher.PasswordsMatch(LegacyPassword, LegacyHash, LegacySalt);

        Assert.True(matches);
    }

    [Fact]
    public void HashPassword_WithDefaultSetting_HashesWithOneHundredThousandIterations()
    {
        var (hash, salt) = _hasher.HashPassword(LegacyPassword);

        byte[] expected = Rfc2898DeriveBytes.Pbkdf2(
            LegacyPassword, Convert.FromBase64String(salt), CustomWebApplicationFactory.ProductionHashIterations, HashAlgorithmName.SHA256, HashLength);
        Assert.Equal(Convert.ToBase64String(expected), hash);
    }
}
