namespace Backend_EnTeck.Models
{
    public class NotificacionOrdenDto
    {
        public string Cliente { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string OrdenId { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        
        // Nuevos campos para que n8n tenga más contexto
        public string Dispositivo { get; set; } = string.Empty;
        public string MensajePersonalizado { get; set; } = string.Empty; 
    }
}