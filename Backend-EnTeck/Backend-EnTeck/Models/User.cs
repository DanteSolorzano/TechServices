using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend_EnTeck.Models;

[Table("Clientes")]
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

    /// <summary>
    /// Nivel de privilegio: 0 = admin, 1 = técnico, 2 = cliente.
    /// Única columna real en la BD.
    /// </summary>
    [Column("nivelPrivilegio")]
    public int NivelPrivilegio { get; set; } = 2;

    // ---- Propiedades calculadas (no se guardan en BD) ----
    // Se siguen serializando al JSON para no romper el frontend.

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