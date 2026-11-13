namespace TechServices.DTOs
{
    public class RegistrarEncuestaDto
    {
        public int IdSolicitud { get; set; }
        public int Calificacion { get; set; }
        public string Comentarios { get; set; } = string.Empty;
    }
}