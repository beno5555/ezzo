using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Storage;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.Data.Seed;

/// <summary>
/// Empties the development database and fills it with a small, named cast for presenting Ezzo. The administrator account
/// (Id 1) is kept and joins the cast; every other row and every uploaded file is removed, and the id counters restart.
/// Times are relative to the run: run it again on the morning of a demo, so the feed is fresh and Mariam's birthday is today.
/// Every password is password123. Each email is a "+username" alias of one of the owner's inboxes, so the reset,
/// reactivation, welcome and digest emails of any account can be opened on stage.
/// </summary>
public class DemoDataSeeder
{
    // A bare word, not "--seed-demo": the command-line configuration provider would read a dashed argument as a setting.
    public const string CommandLineArgument = "seed-demo";

    private const int    KeptAdministratorId = 1;
    private const int    NoRowsKept          = 0;
    private const string SharedPassword      = "password123";
    private const string InboxDomain         = "gmail.com";

    private static readonly string[] Inboxes = ["benashvilisandro202", "benashvilisandro91", "benashvilisandro780"];

    private static readonly TimeSpan LikeSpacing    = TimeSpan.FromMinutes(17);
    private static readonly TimeSpan SeenDelay      = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan EditDelay      = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan LatestPastTime = TimeSpan.FromMinutes(1);

    private readonly ApplicationDbContext _db;
    private readonly PasswordHasher       _passwordHasher;
    private readonly ImageStorage         _imageStorage;

    private DateTime _now;

    public DemoDataSeeder(ApplicationDbContext db, PasswordHasher passwordHasher, ImageStorage imageStorage)
    {
        _db             = db;
        _passwordHasher = passwordHasher;
        _imageStorage   = imageStorage;
    }

    public async Task<DemoSeedSummary> SeedAsync()
    {
        _now = DateTime.UtcNow;

        await using (var transaction = await _db.Database.BeginTransactionAsync())
        {
            await WipeAsync();
            await ResetIdentitiesAsync();

            var users = await SeedUsersAsync();
            SeedFriendships(users);

            var posts = await SeedPostsAsync(users);
            var comments = await SeedCommentsAsync(users, posts);
            SeedMessages(users);
            SeedReports(users, posts, comments);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }

        // Files are removed only once the rows are gone for good; every file on disk predates this run.
        int deletedFileCount = await _imageStorage.DeleteAsync(_imageStorage.ListImageAddressesWrittenBefore(_now));

        return new DemoSeedSummary(
            Users:       await _db.Users.IgnoreQueryFilters().CountAsync(),
            Friendships: await _db.Friendships.CountAsync(),
            Posts:       await _db.Posts.CountAsync(),
            Comments:    await _db.Comments.CountAsync(),
            Likes:       await _db.PostLikes.CountAsync(),
            Messages:    await _db.Messages.CountAsync(),
            Reports:     await _db.Reports.CountAsync(),
            DeletedFiles: deletedFileCount);
    }

    #region Wipe

    // Children before parents, so no foreign key refuses a delete.
    private async Task WipeAsync()
    {
        await _db.RefreshTokens.ExecuteDeleteAsync();
        await _db.Logs.ExecuteDeleteAsync();
        await _db.Reports.ExecuteDeleteAsync();
        await _db.PostLikes.ExecuteDeleteAsync();
        await _db.MessageImages.ExecuteDeleteAsync();
        await _db.Messages.ExecuteDeleteAsync();
        await _db.PostImages.ExecuteDeleteAsync();
        await _db.Comments.ExecuteDeleteAsync();
        await _db.Posts.ExecuteDeleteAsync();
        await _db.Friendships.ExecuteDeleteAsync();
        await _db.UserRoles.Where(userRole => userRole.UserId != KeptAdministratorId).ExecuteDeleteAsync();
        await _db.Users.IgnoreQueryFilters().Where(user => user.Id != KeptAdministratorId).ExecuteDeleteAsync();
    }

    // The next row of each table gets the id after the highest one kept, so the demo's ids start at 1 (users at 2).
    private async Task ResetIdentitiesAsync()
    {
        await ResetIdentityAsync<User>(KeptAdministratorId);
        await ResetIdentityAsync<Friendship>(NoRowsKept);
        await ResetIdentityAsync<Post>(NoRowsKept);
        await ResetIdentityAsync<PostImage>(NoRowsKept);
        await ResetIdentityAsync<Comment>(NoRowsKept);
        await ResetIdentityAsync<PostLike>(NoRowsKept);
        await ResetIdentityAsync<Message>(NoRowsKept);
        await ResetIdentityAsync<MessageImage>(NoRowsKept);
        await ResetIdentityAsync<Report>(NoRowsKept);
        await ResetIdentityAsync<RefreshToken>(NoRowsKept);
        await ResetIdentityAsync<Log>(NoRowsKept);
    }

    // A table that never held a row hands out its seed value next, not the reseed value plus one, so it is left alone.
    private async Task ResetIdentityAsync<TEntity>(int highestKeptId)
    {
        string tableName = _db.Model.FindEntityType(typeof(TEntity))!.GetTableName()!;

        await _db.Database.ExecuteSqlAsync($"""
            IF (SELECT last_value FROM sys.identity_columns WHERE object_id = OBJECT_ID({tableName})) IS NOT NULL
                DBCC CHECKIDENT ({tableName}, RESEED, {highestKeptId}) WITH NO_INFOMSGS;
            """);
    }

    #endregion

    #region Users

    private static readonly DemoUser[] Cast =
    [
        new("nino",    "Street photographer. Old Tbilisi balconies, mostly before 8 am.",           27, Days(58), Minutes(4)),
        new("giorgi",  "Backend developer. Coffee, C# and the occasional hike.",                    29, Days(57), Minutes(25)),
        new("mariam",  "Architecture student. Sketching courtyards on weekends.",                   24, Days(55), Hours(2)),
        new("luka",    "Cooks khinkali better than he plays football.",                             26, Days(52), Hours(5)),
        new("tamar",   "Runs a tiny second-hand bookshop in the old town.",                         34, Days(50), Hours(1)),
        new("davit",   "Jazz piano, late trains, strong opinions about vinyl.",                     31, Days(47), Hours(9)),
        new("ana",     "Hiking every mountain I can reach from Tbilisi.",                           28, Days(45), Days(1)),
        new("irakli",  "Roasting coffee in a garage in Vake.",                                      33, Days(40), Hours(3)),
        new("salome",  "Product designer. Collecting Georgian typefaces.",                          30, Days(36), Minutes(50)),
        new("zura",    "New here. Board games and bad puns.",                                       22, Days(1),  Minutes(15)),
        new("levan",   "Taking a break from social media.",                                         32, Days(56), Days(6)),
        new("keti",    "Moving on.",                                                                25, Days(44), Days(4)),
        new("deals4u", "BEST PRICES IN TOWN!!! Message me for deals",                               40, Days(3),  Hours(6))
    ];

    // Deactivated: can come back through the reactivation email. Soft-deleted: waits for the purge, visible only to administrators.
    private const string DeactivatedUsername = "levan";
    private const string SoftDeletedUsername = "keti";
    private const string BirthdayUsername    = "mariam";

    private static readonly TimeSpan DeactivatedAgo = Days(6);
    private static readonly TimeSpan SoftDeletedAgo = Days(4);
    private static readonly TimeSpan AdminLastActiveAgo = Minutes(30);

    private async Task<Dictionary<string, User>> SeedUsersAsync()
    {
        var users = new Dictionary<string, User>();
        var userRole = await _db.Roles.SingleAsync(role => role.Name == nameof(RoleName.User));

        var administrator = await _db.Users.IgnoreQueryFilters().SingleAsync(user => user.Id == KeptAdministratorId);
        ResetAdministrator(administrator);
        users[administrator.Username] = administrator;

        for (int index = 0; index < Cast.Length; index++)
        {
            var user = NewUser(Cast[index], Inboxes[index % Inboxes.Length]);
            user.UserRoles.Add(new UserRole { Role = userRole });

            _db.Users.Add(user);
            users[user.Username] = user;
        }

        await _db.SaveChangesAsync();

        return users;
    }

    private void ResetAdministrator(User administrator)
    {
        var (hash, salt) = _passwordHasher.HashPassword(SharedPassword);

        administrator.PasswordHash         = hash;
        administrator.PasswordSalt         = salt;
        administrator.LastOnlineAt         = _now - AdminLastActiveAgo;
        administrator.ResetTokenHash       = null;
        administrator.ResetTokenExpiresAt  = null;
        administrator.AccountDeactivatedAt = null;
        administrator.AccountDeletedAt     = null;
        administrator.DigestEmailEnabled   = true;
    }

    private User NewUser(DemoUser demoUser, string inbox)
    {
        var (hash, salt) = _passwordHasher.HashPassword(SharedPassword);
        var birthday = BirthdayFor(demoUser);

        var user = new User
        {
            Username     = demoUser.Username,
            Email        = $"{inbox}+{demoUser.Username}@{InboxDomain}",
            Bio          = demoUser.Bio,
            DateOfBirth  = birthday,
            PasswordHash = hash,
            PasswordSalt = salt,
            CreatedAt    = _now - demoUser.JoinedAgo,
            LastOnlineAt = _now - demoUser.LastActiveAgo
        };

        if (demoUser.Username == DeactivatedUsername)
        {
            user.AccountDeactivatedAt = _now - DeactivatedAgo;
        }

        if (demoUser.Username == SoftDeletedUsername)
        {
            user.AccountDeletedAt = _now - SoftDeletedAgo;
        }

        return user;
    }

    // Mariam's birthday is the day of the run, for the birthday notification; the others are spread over the year.
    private DateTime BirthdayFor(DemoUser demoUser)
    {
        var birthday = _now.Date.AddYears(-demoUser.Age);
        bool isBirthdayUser = demoUser.Username == BirthdayUsername;

        if (!isBirthdayUser)
        {
            birthday = birthday.AddDays(-(demoUser.Username.Length * 37 + demoUser.Age * 5));
        }

        return DateTime.SpecifyKind(birthday, DateTimeKind.Utc);
    }

    #endregion

    #region Friendships

    // sandro_beno, the presenter: five friends with whom he has posts and chats, two requests waiting for him (zura, salome),
    // one he sent (davit), and friends of friends he is not connected to (ana, irakli) for the feed's ranking.
    private static readonly DemoFriendship[] Friendships =
    [
        new("sandro_beno", "nino",    FriendshipStatus.Accepted, Days(50)),
        new("giorgi",      "sandro_beno", FriendshipStatus.Accepted, Days(49)),
        new("sandro_beno", "mariam",  FriendshipStatus.Accepted, Days(45)),
        new("luka",        "sandro_beno", FriendshipStatus.Accepted, Days(40)),
        new("sandro_beno", "tamar",   FriendshipStatus.Accepted, Days(38)),
        new("levan",       "sandro_beno", FriendshipStatus.Accepted, Days(48)),
        new("zura",        "sandro_beno", FriendshipStatus.Pending,  Hours(20)),
        new("salome",      "sandro_beno", FriendshipStatus.Pending,  Days(2)),
        new("sandro_beno", "davit",   FriendshipStatus.Pending,  Days(1)),
        new("deals4u",     "sandro_beno", FriendshipStatus.Declined, Days(2)),

        new("nino",   "giorgi", FriendshipStatus.Accepted, Days(52)),
        new("nino",   "ana",    FriendshipStatus.Accepted, Days(43)),
        new("levan",  "nino",   FriendshipStatus.Accepted, Days(51)),
        new("giorgi", "irakli", FriendshipStatus.Accepted, Days(39)),
        new("keti",   "giorgi", FriendshipStatus.Accepted, Days(30)),
        new("mariam", "tamar",  FriendshipStatus.Accepted, Days(44)),
        new("mariam", "salome", FriendshipStatus.Accepted, Days(33)),
        new("luka",   "davit",  FriendshipStatus.Accepted, Days(46)),
        new("tamar",  "salome", FriendshipStatus.Accepted, Days(34)),
        new("ana",    "irakli", FriendshipStatus.Accepted, Days(37)),
        new("davit",  "salome", FriendshipStatus.Accepted, Days(30)),
        new("zura",   "davit",  FriendshipStatus.Accepted, Hours(18)),
        new("zura",   "nino",   FriendshipStatus.Pending,  Hours(19)),
        new("deals4u", "nino",  FriendshipStatus.Declined, Days(2))
    ];

    private void SeedFriendships(Dictionary<string, User> users)
    {
        foreach (var demoFriendship in Friendships)
        {
            var sentAt = _now - demoFriendship.SentAgo;
            bool isAnswered = demoFriendship.Status != FriendshipStatus.Pending;

            _db.Friendships.Add(new Friendship
            {
                RequesterUserId  = users[demoFriendship.Requester].Id,
                AddresseeUserId  = users[demoFriendship.Addressee].Id,
                FriendshipStatus = demoFriendship.Status,
                SentAt           = sentAt,
                CreatedAt        = sentAt,
                LastUpdatedAt    = isAnswered ? sentAt + Hours(3) : null
            });
        }
    }

    #endregion

    #region Posts and likes

    private static readonly DemoPost[] Posts =
    [
        new("zura-hello", "zura", "Hi everyone",
            "Just joined. I'm into board games and bad puns. Looking for people to play Catan with in Tbilisi.",
            Hours(2), ModerationStatus.Visible, ["davit", "sandro_beno"]),
        new("nino-sololaki", "nino", "Sololaki at sunrise",
            "Got up at six to catch the light on the carved balconies of Sololaki. The street was empty except for one cat who refused to move out of the frame.",
            Hours(3), ModerationStatus.Visible, ["sandro_beno", "giorgi", "mariam", "ana", "tamar", "salome"]),
        new("giorgi-chat", "giorgi", "Finally shipped the chat feature",
            "Real-time messages, typing indicators and read receipts. SignalR did most of the heavy lifting; the hard part was deciding what \"seen\" means.",
            Hours(5), ModerationStatus.Visible, ["sandro_beno", "nino", "irakli"]),
        new("deals4u-income", "deals4u", "Earn 5000 GEL a week from home",
            "No experience needed!!! Click the link in my profile and start TODAY. Only 10 places left!!!",
            Hours(6), ModerationStatus.Flagged, []),
        new("salome-font", "salome", "ახალი შრიფტი",
            "ახალი შრიფტის პირველი ესკიზები მზადაა. ვინ გამოსცდის?",
            Hours(12), ModerationStatus.Visible, ["tamar", "mariam", "davit"]),
        new("mariam-courtyard", "mariam", "Courtyard sketch #12",
            "Italian courtyards in Tbilisi are full of stairs that go nowhere. Spent the afternoon drawing one on Betlemi Street.",
            Hours(20), ModerationStatus.Visible, ["sandro_beno", "tamar", "salome", "nino"]),
        new("luka-burger", "luka", "This burger is killer",
            "The new place near Rustaveli makes a killer burger. I absolutely destroyed it in five minutes.",
            Hours(23), ModerationStatus.Flagged, ["davit"]),
        new("luka-khinkali", "luka", "Khinkali count: 23",
            "Sunday family dinner. New personal record, nobody was impressed. Tip: never use a fork.",
            Days(1), ModerationStatus.Visible, ["sandro_beno", "davit", "giorgi", "nino", "mariam", "tamar", "zura"]),
        new("deals4u-phone", "deals4u", "!!! iPhone 17 for 99 GEL !!!",
            "Limited offer, only today! Send your card number in a message and get the phone tomorrow. 100% legit.",
            Days(1) + Hours(2), ModerationStatus.Hidden, []),
        new("tamar-books", "tamar", "New arrivals at the shop",
            "A box of old Georgian poetry collections came in today, including a 1970s Galaktion Tabidze edition. First come, first served.",
            Days(1) + Hours(4), ModerationStatus.Visible, ["mariam", "salome", "sandro_beno"]),
        new("sandro-hello", "sandro_beno", "Hello, Ezzo!",
            "Welcome to Ezzo, a small place for friends to share posts, talk and stay in touch. Add a few friends, write your first post, and say hi in the chat.",
            Days(1) + Hours(8), ModerationStatus.Visible, ["nino", "giorgi", "mariam", "luka", "tamar", "irakli", "zura"]),
        new("davit-jam", "davit", "Friday jam session",
            "We're playing at a small bar in Fabrika on Friday at 9. Free entry, bring friends who like long piano solos.",
            Days(2), ModerationStatus.Visible, ["luka", "salome", "ana", "zura"]),
        new("ana-gergeti", "ana", "Gergeti Trinity in the clouds",
            "Three hours up from Stepantsminda, and the church disappeared into a cloud the moment we arrived. Worth it anyway.",
            Days(2) + Hours(6), ModerationStatus.Visible, ["nino", "irakli", "giorgi"]),
        new("irakli-beans", "irakli", "Ethiopian beans this week",
            "Light roast with notes of blueberry. Stop by on Saturday morning if you want a free cup and an honest opinion.",
            Days(3), ModerationStatus.Visible, ["giorgi", "ana"]),
        new("salome-mkhedruli", "salome", "Designing with Georgian letters",
            "Mkhedruli has no capital letters, which makes headings surprisingly hard. Working on a heavier display weight that still reads well at small sizes.",
            Days(3) + Hours(5), ModerationStatus.Visible, ["tamar", "mariam", "davit", "sandro_beno"]),
        new("nino-market", "nino", "Dry Bridge market finds",
            "An old Zenit camera, a box of postcards from Batumi and a brass door knocker shaped like a hand. My wallet is lighter, my shelf is fuller.",
            Days(4), ModerationStatus.Visible, ["giorgi", "ana", "sandro_beno"]),
        new("giorgi-boots", "giorgi", "Any recommendations for hiking boots?",
            "Mine fell apart on the way to Juta. Looking for something that survives rocks and rain without costing a month's salary.",
            Days(4) + Hours(6), ModerationStatus.Visible, ["ana"]),
        new("mariam-exams", "mariam", "Exam season",
            "Three projects due next week. If you don't hear from me, I'm under a pile of tracing paper.",
            Days(5), ModerationStatus.Visible, ["tamar", "sandro_beno"]),
        new("tamar-club", "tamar", "Reading club, next Thursday",
            "We're reading \"The Knight in the Panther's Skin\" again, a chapter a week. Tea and churchkhela provided.",
            Days(6), ModerationStatus.Visible, ["mariam", "salome"]),
        new("luka-match", "luka", "Match day",
            "Dinamo won 2-1 in the last minute. My voice is gone.",
            Days(6) + Hours(8), ModerationStatus.Visible, ["davit"]),
        new("sandro-building", "sandro_beno", "Building Ezzo",
            "Two months of evenings: ASP.NET Core, Angular, SignalR and a lot of coffee from Irakli. Thanks to everyone who tested the early versions.",
            Days(8), ModerationStatus.Visible, ["giorgi", "nino", "irakli", "tamar"]),
        new("davit-vinyl", "davit", "Vinyl Sunday",
            "Found a Melodiya pressing of Georgian polyphonic songs at the flea market. The crackle is part of the music.",
            Days(9), ModerationStatus.Visible, ["luka", "salome"]),
        new("ana-tusheti", "ana", "Packing list for Tusheti",
            "Rain jacket, power bank, cash (no ATMs past Omalo) and patience for the road. What else am I forgetting?",
            Days(10), ModerationStatus.Visible, ["irakli", "nino", "luka"]),
        new("levan-break", "levan", "Taking a break",
            "Logging off for a while. See you all in the spring.",
            Days(7), ModerationStatus.Visible, ["nino"])
    ];

    private async Task<Dictionary<string, Post>> SeedPostsAsync(Dictionary<string, User> users)
    {
        var posts = new Dictionary<string, Post>();

        foreach (var demoPost in Posts)
        {
            var createdAt = _now - demoPost.Ago;
            var post = new Post
            {
                UserId           = users[demoPost.Author].Id,
                PostTitle        = demoPost.Title,
                PostContent      = demoPost.Content,
                ModerationStatus = demoPost.Status,
                CreatedAt        = createdAt
            };

            for (int index = 0; index < demoPost.LikedBy.Length; index++)
            {
                post.Likes.Add(new PostLike
                {
                    UserId    = users[demoPost.LikedBy[index]].Id,
                    CreatedAt = InThePast(createdAt + LikeSpacing * (index + 1))
                });
            }

            _db.Posts.Add(post);
            posts[demoPost.Key] = post;
        }

        await _db.SaveChangesAsync();

        return posts;
    }

    #endregion

    #region Comments

    private static readonly DemoComment[] Comments =
    [
        new("nino-sololaki",  "mariam",      "The light on that wooden lattice is perfect.",               Minutes(20)),
        new("nino-sololaki",  "sandro_beno", "That cat deserves a credit in the caption.",                 Minutes(45)),
        new("nino-sololaki",  "giorgi",      "Which street exactly? I want to go this weekend.",           Hours(1)),
        new("nino-sololaki",  "nino",        "Near the top of Galaktion Tabidze street. Go early!",        Hours(1) + Minutes(20)),
        new("giorgi-chat",    "sandro_beno", "Typing indicators are the best part.",                       Minutes(30)),
        new("giorgi-chat",    "nino",        "Read receipts are dangerous. Now everyone knows I ignore them.", Hours(1)),
        new("giorgi-chat",    "irakli",      "Congrats! Coffee is on me.",                                 Hours(2)),
        new("zura-hello",     "sandro_beno", "Welcome to Ezzo!",                                           Minutes(25)),
        new("zura-hello",     "davit",       "Catan night? I'm in.",                                       Minutes(50)),
        new("mariam-courtyard", "tamar",     "Frame it and I'll hang it in the shop.",                     Hours(2)),
        new("mariam-courtyard", "sandro_beno", "Stairs that go nowhere: the most Tbilisi thing ever.",     Hours(4)),
        new("luka-khinkali",  "davit",       "23 is rookie numbers.",                                      Hours(1)),
        new("luka-khinkali",  "sandro_beno", "Fork users should be reported.",                             Hours(2)),
        new("luka-khinkali",  "giorgi",      "My record is 31, and I regret nothing.",                     Hours(3)),
        new("tamar-books",    "mariam",      "Save one for me, please!",                                   Hours(1)),
        new("tamar-books",    "salome",      "Do you have anything with old hand-lettered covers?",        Hours(3)),
        new("sandro-hello",   "nino",        "Happy to be here!",                                          Minutes(15)),
        new("sandro-hello",   "giorgi",      "Finally a feed that isn't full of ads.",                     Minutes(40)),
        new("sandro-hello",   "luka",        "Where's the khinkali emoji?",                                Hours(2)),
        new("sandro-hello",   "tamar",       "Congratulations on the launch!",                             Hours(5)),
        new("davit-jam",      "luka",        "I'll be there.",                                             Hours(2)),
        new("davit-jam",      "ana",         "Can I bring my ukulele?",                                    Hours(4)),
        new("davit-jam",      "davit",       "Absolutely.",                                                Hours(5)),
        new("ana-gergeti",    "irakli",      "Next time take me, I'll bring a thermos.",                   Hours(3)),
        new("ana-gergeti",    "nino",        "The clouds make it more dramatic anyway.",                   Hours(6)),
        new("irakli-beans",   "giorgi",      "Saturday, count me in.",                                     Hours(2)),
        new("irakli-beans",   "ana",         "Blueberry? In coffee? I need to taste it to believe it.",    Hours(5)),
        new("salome-mkhedruli", "tamar",     "I'd love to see it on book covers.",                         Hours(3)),
        new("salome-mkhedruli", "mariam",    "Mkhedruli headings are a pain in my presentations too.",     Hours(7)),
        new("giorgi-boots",   "ana",         "Get something with a proper sole and break them in before Juta.", Hours(2)),
        new("giorgi-boots",   "luka",        "Just wear sneakers like a true Georgian.",                   Hours(4)),
        new("mariam-exams",   "sandro_beno", "Good luck! Message me if you need a break.",                 Hours(3)),
        new("tamar-club",     "mariam",      "I'll bring the churchkhela.",                                Hours(5)),
        new("luka-match",     "davit",       "My neighbours heard you.",                                   Hours(1)),
        new("sandro-building", "irakli",     "The coffee was a business investment.",                      Hours(4)),
        new("sandro-building", "giorgi",     "Proud of you, man.",                                         Hours(6)),
        new("ana-tusheti",    "luka",        "Snacks. Lots of snacks.",                                    Hours(2)),
        new("ana-tusheti",    "irakli",      "A good book for when the road is closed.",                   Hours(8)),
        new("deals4u-phone",  "nino",        "This is a scam, don't send anyone your card number.",        Minutes(30)),
        new("sandro-hello",   "deals4u",     "Get 10,000 followers for 5 GEL!!! Link in my profile",        Hours(9), ModerationStatus.Flagged, "spam-followers"),
        new("luka-khinkali",  "deals4u",     "Cheap phones, message me now!!!",                            Hours(6), ModerationStatus.Hidden,  "spam-phones")
    ];

    private async Task<Dictionary<string, Comment>> SeedCommentsAsync(Dictionary<string, User> users, Dictionary<string, Post> posts)
    {
        var comments = new Dictionary<string, Comment>();

        foreach (var demoComment in Comments)
        {
            var post = posts[demoComment.PostKey];
            var comment = new Comment
            {
                PostId           = post.Id,
                CommenterUserId  = users[demoComment.Author].Id,
                CommentContent   = demoComment.Content,
                ModerationStatus = demoComment.Status,
                CreatedAt        = InThePast(post.CreatedAt + demoComment.AfterPost)
            };

            _db.Comments.Add(comment);

            if (demoComment.Key is not null)
            {
                comments[demoComment.Key] = comment;
            }
        }

        await _db.SaveChangesAsync();

        return comments;
    }

    #endregion

    #region Messages

    // sandro_beno has three chats: Nino's ends with two unread messages, Mariam's with one, Giorgi's is all read and holds
    // an edited message. Levan's (deactivated) shows how a chat with an inactive account looks. Luka and Tamar are friends
    // without a chat yet, so they appear in the list of people to start one with.
    private static readonly DemoMessage[] Messages =
    [
        new("levan", "sandro_beno", "Hey, I'm deleting the apps for a few months. Take care!", Days(7), Seen: true),
        new("sandro_beno", "levan", "Good luck, enjoy the quiet. See you in spring.",           Days(7) - Minutes(20), Seen: true),

        new("giorgi", "sandro_beno", "The typing indicator flickers when I switch tabs.",         Days(2), Seen: true),
        new("sandro_beno", "giorgi", "Probably the reconnect. Can you send me the steps?",        Days(2) - Minutes(5), Seen: true, Edited: true),
        new("giorgi", "sandro_beno", "Open a chat, switch tabs for ten seconds, come back.",      Days(2) - Minutes(9), Seen: true),
        new("sandro_beno", "giorgi", "Got it, fixed. It was the reconnect.",                      Days(1) + Hours(20), Seen: true),
        new("giorgi", "sandro_beno", "Nice! Coffee at Irakli's on Saturday?",                     Days(1) + Hours(19), Seen: true),
        new("sandro_beno", "giorgi", "Deal.",                                                     Days(1) + Hours(19) - Minutes(3), Seen: true),

        new("sandro_beno", "mariam", "How is the courtyard project going?",                       Days(1), Seen: true),
        new("mariam", "sandro_beno", "Slowly. Too many stairs to draw.",                          Hours(22), Seen: true),
        new("mariam", "sandro_beno", "Can I borrow your drawing tablet for the exam week?",       Hours(4)),

        new("nino", "sandro_beno", "Did you see the Sololaki photos?",                            Hours(3), Seen: true),
        new("sandro_beno", "nino", "Yes! The cat one is my favourite.",                           Hours(2) + Minutes(50), Seen: true),
        new("nino", "sandro_beno", "He's the real star of the series.",                           Hours(2) + Minutes(45), Seen: true),
        new("sandro_beno", "nino", "Send me the full-size version?",                              Hours(2) + Minutes(30), Seen: true, Edited: true),
        new("nino", "sandro_beno", "Are you coming to Davit's jam on Friday?",                    Minutes(40)),
        new("nino", "sandro_beno", "I can pick you up at 8:30.",                                  Minutes(38)),

        new("nino", "giorgi", "Your chat feature is great, but now I can't pretend I didn't read your message.", Hours(4), Seen: true),
        new("giorgi", "nino", "That's the point :)",                                              Hours(3) + Minutes(55)),
        new("ana", "irakli", "Is the Ethiopian roast still available?",                           Days(2), Seen: true),
        new("irakli", "ana", "Saved you a bag.",                                                  Days(2) - Hours(1), Seen: true),
        new("mariam", "tamar", "Did the poetry box come in?",                                     Days(1) + Hours(6), Seen: true),
        new("tamar", "mariam", "Yes, and I put one aside for you.",                               Days(1) + Hours(3))
    ];

    private void SeedMessages(Dictionary<string, User> users)
    {
        foreach (var demoMessage in Messages)
        {
            var createdAt = _now - demoMessage.Ago;

            _db.Messages.Add(new Message
            {
                SenderUserId   = users[demoMessage.Sender].Id,
                ReceiverUserId = users[demoMessage.Receiver].Id,
                MessageContent = demoMessage.Content,
                CreatedAt      = createdAt,
                Seen           = demoMessage.Seen,
                SeenAt         = demoMessage.Seen ? InThePast(createdAt + SeenDelay) : null,
                LastUpdatedAt  = demoMessage.Edited ? InThePast(createdAt + EditDelay) : null
            });
        }
    }

    #endregion

    #region Reports

    // The moderation pages start with work to do: a hidden scam post with five pending reports (what the automation's
    // five-report rule leaves behind), a flagged spam post and comment, a reported account, and two decided reports for the history.
    private static readonly DemoReport[] Reports =
    [
        new("nino",   ReportTargetType.Post, "deals4u-phone", "Scam: asks people for their card numbers.",  Days(1)),
        new("giorgi", ReportTargetType.Post, "deals4u-phone", "Fraud.",                                     Days(1) - Minutes(20)),
        new("mariam", ReportTargetType.Post, "deals4u-phone", "This is a scam.",                            Hours(23)),
        new("tamar",  ReportTargetType.Post, "deals4u-phone", "Asking for card details.",                   Hours(22)),
        new("luka",   ReportTargetType.Post, "deals4u-phone", "Spam and probably a scam.",                  Hours(21)),
        new("ana",    ReportTargetType.Post, "deals4u-income", "Spam.",                                     Hours(5)),
        new("irakli", ReportTargetType.Post, "deals4u-income", "Too good to be true, looks like a scam.",   Hours(4)),
        new("tamar",  ReportTargetType.Comment, "spam-followers", "Spam in the comments.",                  Hours(20)),
        new("salome", ReportTargetType.User, "deals4u", "Spam account: every post is a scam offer.",        Hours(3)),
        new("davit",  ReportTargetType.Comment, "spam-phones", "Spam.",                                     Hours(17),
            ReportStatus.Resolved, Hours(16)),
        new("zura",   ReportTargetType.Post, "luka-khinkali", "Promotes overeating.",                       Hours(15),
            ReportStatus.Rejected, Hours(14))
    ];

    private void SeedReports(Dictionary<string, User> users, Dictionary<string, Post> posts, Dictionary<string, Comment> comments)
    {
        var administrator = users.Values.Single(user => user.Id == KeptAdministratorId);

        foreach (var demoReport in Reports)
        {
            bool isDecided = demoReport.Status != ReportStatus.Pending;
            int targetId = demoReport.TargetType switch
            {
                ReportTargetType.Post    => posts[demoReport.TargetKey].Id,
                ReportTargetType.Comment => comments[demoReport.TargetKey].Id,
                _                        => users[demoReport.TargetKey].Id
            };

            _db.Reports.Add(new Report
            {
                ReporterUserId   = users[demoReport.Reporter].Id,
                TargetType       = demoReport.TargetType,
                TargetId         = targetId,
                Reason           = demoReport.Reason,
                Status           = demoReport.Status,
                CreatedAt        = _now - demoReport.Ago,
                ReviewedByUserId = isDecided ? administrator.Id : null,
                ReviewedAt       = isDecided ? _now - demoReport.ReviewedAgo : null
            });
        }
    }

    #endregion

    // A time computed from an offset never lands after the run itself.
    private DateTime InThePast(DateTime time)
    {
        var latest = _now - LatestPastTime;
        return time < latest ? time : latest;
    }

    private static TimeSpan Minutes(double minutes)
    {
        return TimeSpan.FromMinutes(minutes);
    }

    private static TimeSpan Hours(double hours)
    {
        return TimeSpan.FromHours(hours);
    }

    private static TimeSpan Days(double days)
    {
        return TimeSpan.FromDays(days);
    }

    private sealed record DemoUser(string Username, string Bio, int Age, TimeSpan JoinedAgo, TimeSpan LastActiveAgo);

    private sealed record DemoFriendship(string Requester, string Addressee, FriendshipStatus Status, TimeSpan SentAgo);

    private sealed record DemoPost(
        string Key, string Author, string Title, string Content, TimeSpan Ago, ModerationStatus Status, string[] LikedBy);

    private sealed record DemoComment(
        string PostKey, string Author, string Content, TimeSpan AfterPost,
        ModerationStatus Status = ModerationStatus.Visible, string? Key = null);

    private sealed record DemoMessage(
        string Sender, string Receiver, string Content, TimeSpan Ago, bool Seen = false, bool Edited = false);

    private sealed record DemoReport(
        string Reporter, ReportTargetType TargetType, string TargetKey, string Reason, TimeSpan Ago,
        ReportStatus Status = ReportStatus.Pending, TimeSpan ReviewedAgo = default);
}
