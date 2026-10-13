using Microsoft.AspNetCore.Mvc;
using Backend_EnTeck.Services;

namespace Backend_EnTeck.Controllers;

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
    public async Task<IActionResult> EnviarNotificacion([FromBody] NotificacionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Telefono) || string.IsNullOrWhiteSpace(dto.Mensaje))
        {
            return BadRequest(new { mensaje = "El número de teléfono y el mensaje son obligatorios." });
        }

        var exito = await _whatsAppService.EnviarMensajeAsync(dto.Telefono, dto.Mensaje);

        if (exito)
        {
            return Ok(new { mensaje = "Notificación de WhatsApp procesada correctamente." });
        }

        return StatusCode(500, new { mensaje = "No se pudo enviar la notificación de WhatsApp." });
    }
}

public class NotificacionDto
{
    public string Telefono { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
}