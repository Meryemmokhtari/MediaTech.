
using Microsoft.EntityFrameworkCore;
using MediaTech.Api.Models;

namespace MediaTech.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
}
