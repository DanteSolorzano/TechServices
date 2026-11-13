using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechServices.Models;

[Table("EncuestasSatisfaccion")]
public class EncuestaSatisfaccion
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("id_solicitud")]
    public int IdSolicitud { get; set; }

    [Range(1, 5)]
    [Column("calificacion")]
    public int Calificacion { get; set; }

    [Column("comentarios")]
    public string? Comentarios { get; set; }

    [Column("fecha_respuesta")]
    public DateTime FechaRespuesta { get; set; } = DateTime.Now;
}