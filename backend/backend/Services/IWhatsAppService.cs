using TechServices.DTOs;

namespace TechServices.Services;

public interface IWhatsAppService
{
    Task<bool> EnviarNotificacionWebhookAsync(NotificacionOrdenDto dto);
}