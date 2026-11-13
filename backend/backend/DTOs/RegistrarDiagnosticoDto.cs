namespace TechServices.DTOs
{
    public class RegistrarDiagnosticoDto
    {
        public string Diagnostico { get; set; } = string.Empty;
        public string PiezasUtilizadas { get; set; } = string.Empty;
        public string? Estado { get; set; }
    }
}