using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_EnTeck.Models;

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

    [Column("esAdmin")]
    public bool EsAdmin { get; set; }
}
