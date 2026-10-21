using Microsoft.AspNetCore.Mvc;
using Backend_EnTeck.Services;
using Backend_EnTeck.Models;

namespace Backend_EnTeck.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WhatsAppController : ControllerBase
    {
        private readonly IWhatsAppService _whatsAppService;

        public WhatsAppController(IWhatsAppService whatsAppService)
        {
            _whatsAppService = whatsAppService;
        }

        [HttpPost("enviar")]
        public async Task<IActionResult> EnviarNotificacion([FromBody] NotificacionOrdenDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Telefono) || string.IsNullOrWhiteSpace(dto.Mensaje))
            {
                return BadRequest(new { mensaje = "El número de teléfono y el mensaje son obligatorios." });
            }

            var exito = await _whatsAppService.EnviarNotificacionWebhookAsync(dto);

            if (exito)
            {
                return Ok(new { mensaje = "Notificación de WhatsApp enviada a n8n correctamente." });
            }

            return StatusCode(500, new { mensaje = "No se pudo enviar la notificación a n8n." });
        }
        // ====================================================================
        // GET: api/WhatsApp/reporte-semanal
        // Lógica US-017: Emisión/Consulta de métricas para la automatización con n8n
        // ====================================================================
        [HttpGet("reporte-semanal")]
        public async Task<IActionResult> ObtenerReporteSemanal([FromQuery] string telefonoAdmin = "+524737563898")
        {
            var fechaFin = DateTime.Now;
            var fechaInicio = fechaFin.AddDays(-7);

            // 1. Lógica de consulta agregada (ejemplo de estructura de evento inmutable para n8n)
            // Nota: Se puede consultar _context si tienes la tabla inyectada en WhatsAppController
            var eventoPayload = new ReporteSemanalEventDto
            {
                Evento = "ReporteSemanalGenerado",
                FechaInicio = fechaInicio,
                FechaFin = fechaFin,
                TotalOrdenesAtendidas = 12,
                OrdenesEntregadas = 10,
                TotalVentasIngresos = 18500.00m,
                TelefonoAdministrador = telefonoAdmin
            };

            // 2. Retorna el payload que n8n o el Cronjob consumirán de forma asíncrona (EDA)
            return Ok(eventoPayload);
        }
    }
        // ====================================================================
        // DTO para el evento de Reporte Semanal de Ventas y Taller (US-017)
        // ====================================================================
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