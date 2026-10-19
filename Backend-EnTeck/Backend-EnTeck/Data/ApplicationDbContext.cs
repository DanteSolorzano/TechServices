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
    public DbSet<EncuestaSatisfaccion> EncuestasSatisfaccion { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Clientes");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<SolicitudServicio>(entity =>
        {
            entity.ToTable("SolicitudServicio");
            entity.HasKey(e => e.Id);
        });
    }
}