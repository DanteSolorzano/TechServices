using Microsoft.AspNetCore.Mvc;
using TechServices.Services;
using TechServices.DTOs; // <-- DTOs

namespace TechServices.Controllers
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
            if (string.IsNullOrWhiteSpace(dto.Telefono) || string.IsNullOrWhiteSpace(dto.MensajePersonalizado))
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

        [HttpGet("reporte-semanal")]
        public async Task<IActionResult> ObtenerReporteSemanal([FromQuery] string telefonoAdmin = "+524737563898")
        {
            var fechaFin = DateTime.Now;
            var fechaInicio = fechaFin.AddDays(-7);

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

            return Ok(eventoPayload);
        }
    }
}