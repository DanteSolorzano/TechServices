using Backend_EnTeck.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_EnTeck.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<SolicitudServicio> SolicitudesServicio { get; set; } = null!;
}