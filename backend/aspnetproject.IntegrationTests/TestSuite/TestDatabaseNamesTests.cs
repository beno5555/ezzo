using aspnetproject.IntegrationTests.Fixtures;

namespace aspnetproject.IntegrationTests.TestSuite;

// The pool is named after the checkout's base test database, so two checkouts never share a database.
public class TestDatabaseNamesTests
{
    private const string MainBaseName = "TestSocialMediaWebApiDb";

    [Fact]
    public void ForPool_NumbersEachDatabaseAfterTheBaseName()
    {
        var names = TestDatabaseNames.ForPool(MainBaseName, 4);

        Assert.Equal(
            ["TestSocialMediaWebApiDb_1", "TestSocialMediaWebApiDb_2", "TestSocialMediaWebApiDb_3", "TestSocialMediaWebApiDb_4"],
            names);
    }

    [Theory]
    [InlineData("TestSocialMediaWebApiDb_parallel_test_classes")]
    [InlineData("TestSocialMediaWebApiDb_1")] // a worktree folder named "1"
    [InlineData("TestSocialMediaWebApiDb_2_1")]
    public void ForPool_ForAWorktreeAndTheMainCheckout_SharesNoName(string worktreeBaseName)
    {
        var mainPool     = TestDatabaseNames.ForPool(MainBaseName, TestDatabaseNames.MaxPoolSize);
        var worktreePool = TestDatabaseNames.ForPool(worktreeBaseName, TestDatabaseNames.MaxPoolSize);

        Assert.Empty(mainPool.Intersect(worktreePool));
    }

    [Fact]
    public void PoolSize_IsAtMostFourAndAtMostTheCoreCount()
    {
        Assert.Equal(Math.Min(4, Environment.ProcessorCount), TestDatabaseNames.PoolSize);
    }
}
