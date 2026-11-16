using aspnetproject.IntegrationTests.Fixtures;

namespace aspnetproject.IntegrationTests.TestSuite;

// Test classes running at the same time borrow from one lender, so a database on loan must never be lent again.
// These tests use their own lender over made-up names; they touch no database.
public class DatabaseLenderTests
{
    private static readonly TimeSpan WaitThatShouldNotEnd = TimeSpan.FromMilliseconds(200);

    [Fact]
    public async Task BorrowAsync_WhileEveryDatabaseIsOnLoan_LendsEachOnlyOnce()
    {
        var lender = new DatabaseLender(["db_1", "db_2", "db_3"]);

        string[] borrowed = await Task.WhenAll(lender.BorrowAsync(), lender.BorrowAsync(), lender.BorrowAsync());

        Assert.Equal(["db_1", "db_2", "db_3"], borrowed.Order());
    }

    [Fact]
    public async Task BorrowAsync_WhenEveryDatabaseIsOnLoan_WaitsUntilOneIsReturned()
    {
        var lender = new DatabaseLender(["db_1"]);
        string first = await lender.BorrowAsync();

        var waiting = lender.BorrowAsync();
        var finishedFirst = await Task.WhenAny(waiting, Task.Delay(WaitThatShouldNotEnd));
        lender.Return(first);
        string second = await waiting;

        Assert.NotSame(waiting, finishedFirst);
        Assert.Equal(first, second);
    }

    [Fact]
    public async Task Return_ForADatabaseNotOnLoan_Throws()
    {
        var lender = new DatabaseLender(["db_1", "db_2"]);
        string borrowed = await lender.BorrowAsync();
        lender.Return(borrowed);

        var exception = Record.Exception(() => lender.Return(borrowed));

        Assert.IsType<InvalidOperationException>(exception);
    }

    [Fact]
    public async Task IsOnLoan_ReflectsBorrowAndReturn()
    {
        var lender = new DatabaseLender(["db_1"]);

        string borrowed = await lender.BorrowAsync();
        bool onLoanAfterBorrow = lender.IsOnLoan(borrowed);
        lender.Return(borrowed);
        bool onLoanAfterReturn = lender.IsOnLoan(borrowed);

        Assert.True(onLoanAfterBorrow);
        Assert.False(onLoanAfterReturn);
    }
}
