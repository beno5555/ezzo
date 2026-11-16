using aspnetproject.IntegrationTests.Fixtures;

// Each test class is its own xUnit collection, so classes run at once and the tests inside one class run one after
// another. No more classes run at once than the database pool can hold; a class that finds every database on loan waits.
[assembly: CollectionBehavior(MaxParallelThreads = TestDatabaseNames.MaxPoolSize)]
