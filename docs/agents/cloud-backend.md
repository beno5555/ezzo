# Running the backend in a cloud session

A cloud container has the .NET 10 SDK and the Docker CLI, but no database and no settings files, and it does not start the Docker daemon. `scripts/test-linux.sh` does the first two for the test suite; this page does the same for `dotnet run`, so a page that needs data can be looked at. Do not print or commit the password or the JWT key.

1. **Docker and SQL Server.** The script keeps its state in `~/.webcity-test` (the `sa` password, the `webcity-test-sql` container); reuse it, or make it by hand:

   ```bash
   docker info > /dev/null 2>&1 || (mkdir -p ~/.webcity-test && nohup dockerd > ~/.webcity-test/dockerd.log 2>&1 &)
   ( umask 077 && echo "$(openssl rand -hex 16)Aa1" > ~/.webcity-test/sa-password )
   docker run -d --name webcity-test-sql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD="$(cat ~/.webcity-test/sa-password)" -p 127.0.0.1:1433:1433 mcr.microsoft.com/mssql/server:2022-latest
   ```

   Wait until `docker exec -e SQLCMDPASSWORD=… webcity-test-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -Q "SELECT 1"` answers. Later sessions on the same container start it with `docker start webcity-test-sql`.
2. **Settings.** Write `backend/aspnetproject/appsettings.Development.json` (gitignored) with the settings that hold no secret: `Jwt:{AccessTokenMinutes,RefreshTokenDays}`, `PasswordConfiguration:ResetTokenMinutes`, `EmailConfiguration:Enabled` set to `false`, `CleanupConfiguration:{RefreshTokens,SoftDeletedUsers,OldLogs}` as empty objects (the defaults apply) and `Cors:AllowedOrigins` with `http://localhost:4200`. The two secrets go in the environment of the shell that runs the backend:

   ```bash
   export ConnectionStrings__DefaultConnection="Server=localhost;Database=WebCityDev;User Id=sa;Password=$(cat ~/.webcity-test/sa-password);TrustServerCertificate=True"
   export Jwt__Key="$(openssl rand -hex 48)"
   ```
3. **Migrate and run,** from `backend/` (the app does not migrate at startup):

   ```bash
   dotnet tool install -g dotnet-ef && export PATH="$PATH:$HOME/.dotnet/tools"
   dotnet ef database update --project aspnetproject
   dotnet run --project aspnetproject --launch-profile https
   ```
4. **An administrator.** Register the account through `POST /api/auth/register`, then give it the role in the database: `INSERT INTO UserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM Users u, Roles r WHERE u.Username = '<name>' AND r.Name = 'Administrator'`, run with `sqlcmd` inside the container (`-d WebCityDev`). Registration allows about ten accounts per window per IP.
5. **Afterwards,** stop the backend and the frontend, run `docker stop webcity-test-sql`, and confirm ports 4200, 7102 and 5045 are free.
