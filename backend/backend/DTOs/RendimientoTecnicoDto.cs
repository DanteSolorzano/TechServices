namespace TechServices.DTOs
{
    public class RendimientoTecnicoDto
    {
        public int TecnicoId { get; set; }
        public string NombreTecnico { get; set; } = string.Empty;
        public int OrdenesAsignadas { get; set; }
        public int OrdenesFinalizadas { get; set; }
        public int OrdenesEnProceso { get; set; }
    }
}