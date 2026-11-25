namespace aspnetproject.Data.Seed;

// What DemoDataSeeder left in the database, and how many stale upload files it removed.
public record DemoSeedSummary(
    int Users,
    int Friendships,
    int Posts,
    int Comments,
    int Likes,
    int Messages,
    int Reports,
    int DeletedFiles);
