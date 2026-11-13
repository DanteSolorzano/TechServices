namespace TechServices.DTOs
{
    public class ReporteSemanalEventDto
    {
        public string Evento { get; set; } = "ReporteSemanalGenerado";
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int TotalOrdenesAtendidas { get; set; }
        public int OrdenesEntregadas { get; set; }
        public decimal TotalVentasIngresos { get; set; }
        public string TelefonoAdministrador { get; set; } = string.Empty;
    }
}