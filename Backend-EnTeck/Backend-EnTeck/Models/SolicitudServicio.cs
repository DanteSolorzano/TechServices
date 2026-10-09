using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_EnTeck.Models;

[Table("SolicitudServicio")]
public class SolicitudServicio
{
    [Column("id")]
    public int Id { get; set; }

    [Column("marca")]
    public string Marca { get; set; } = string.Empty;

    [Column("modelo")]
    public string Modelo { get; set; } = string.Empty;

    [Column("problema")]
    public string Problema { get; set; } = string.Empty;

    [Column("estado")]
    public string Estado { get; set; } = "Recibido";

    [Column("fecha_recibido")]
    public DateTime FechaRecibido { get; set; }

    [Column("eta")]
    public DateTime? Eta { get; set; }

    [Column("id_cliente")]
    public int IdCliente { get; set; }

    // --- PROPIEDADES NAVEGACIONALES Y DE ASIGNACIÓN (US-011 y US-012) ---
    [Column("id_tecnico")]
    public int? IdTecnico { get; set; }

    [Column("nombre_tecnico")]
    public string? NombreTecnico { get; set; }

    [Column("fecha_asignacion")]
    public DateTime? FechaAsignacion { get; set; }
}