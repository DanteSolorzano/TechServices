using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_EnTeck.Models
{
    public class EncuestaSatisfaccion
    {
        [Key]
        public int Id { get; set; }

        public int IdSolicitud { get; set; }

        [Range(1, 5)]
        public int Calificacion { get; set; }

        public string Comentarios { get; set; } = string.Empty;

        public DateTime FechaRespuesta { get; set; } = DateTime.Now;
    }
}