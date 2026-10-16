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
    }
}