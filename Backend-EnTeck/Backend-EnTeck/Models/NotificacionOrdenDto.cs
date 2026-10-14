namespace Backend_EnTeck.Models
{
    public class NotificacionOrdenDto
    {
        public int OrdenId { get; set; }
        public string Cliente { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
    }
}