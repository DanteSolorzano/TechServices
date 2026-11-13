namespace TechServices.DTOs
{
    public class ReporteRendimientoDto
    {
        public int TotalOrdenes { get; set; }
        public int Completadas { get; set; }
        public int EnProceso { get; set; }
        public int Pendientes { get; set; }
        public List<RendimientoTecnicoDto> RendimientoTecnicos { get; set; } = new();
    }
}