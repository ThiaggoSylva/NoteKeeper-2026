using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using NoteKeeper.Infraestrutura.Compartilhado.Orm;

namespace NoteKeeper.Api.Compartilhado.Orm;

public sealed class NoteKeeperDbContextFactory : IDesignTimeDbContextFactory<NoteKeeperDbContext>
{
    public NoteKeeperDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<NoteKeeperDbContextFactory>(optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connection = configuration.GetConnectionString("SqlServer")
            ?? "Server=localhost;Database=NoteKeeperDb;User Id=sa;Password=CrieUmaSenhaForte@123!;TrustServerCertificate=True";

        var options = new DbContextOptionsBuilder<NoteKeeperDbContext>()
            .UseSqlServer(connection, sqlOptions =>
                sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null))
            .Options;

        return new NoteKeeperDbContext(options);
    }
}
