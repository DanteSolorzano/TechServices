using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechServices.Models;

[Table("Usuarios")]
public class User
{
    [Column("id")]
    public int Id { get; set; }
    
    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;
    
    [Column("telefono")]
    public string Telefono { get; set; } = string.Empty;
    
    [Column("correo")]
    public string Correo { get; set; } = string.Empty;
    
    [Column("contrasena")]
    public string Contrasena { get; set; } = string.Empty;
    
    [Column("direccion")]
    public string? Direccion { get; set; }

    [Column("nivelPrivilegio")]
    public int NivelPrivilegio { get; set; } = 2; // 0 = admin, 1 = tecnico, 2 = cliente

    // ---- Propiedades calculadas (No se guardan en BD) ----

    [NotMapped]
    public bool EsAdmin
    {
        get => NivelPrivilegio == 0;
    }

    [NotMapped]
    public string Rol => NivelPrivilegio switch
    {
        0 => "admin",
        1 => "tecnico",
        2 => "cliente",
        _ => "cliente"
    };
}