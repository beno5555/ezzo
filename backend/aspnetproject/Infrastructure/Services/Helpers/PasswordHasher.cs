using System.Security.Cryptography;
using aspnetproject.Infrastructure.Services.Helpers.Configuration;
using Microsoft.Extensions.Options;

namespace aspnetproject.Infrastructure.Services.Helpers;

public class PasswordHasher
{
    private const int SaltLength = 32;
    private const int HashLength = 32;

    private readonly int _iterations;

    public PasswordHasher(IOptions<PasswordHashingConfiguration> options)
    {
        _iterations = options.Value.HashIterations;
    }

    public (string hash, string salt) HashPassword(string password)
    {
        byte[] saltBytes = RandomNumberGenerator.GetBytes(SaltLength);
        byte[] hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            password,
            saltBytes,
            _iterations,
            HashAlgorithmName.SHA256,
            HashLength);
        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }

    public bool PasswordsMatch(string password, string storedHash, string storedSalt)
    {
        byte[] saltBytes = Convert.FromBase64String(storedSalt);

        byte[] hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            password,
            saltBytes,
            _iterations,
            HashAlgorithmName.SHA256,
            HashLength);

        bool isValid = CryptographicOperations.FixedTimeEquals(hashBytes, Convert.FromBase64String(storedHash));
        return isValid;
    }
}