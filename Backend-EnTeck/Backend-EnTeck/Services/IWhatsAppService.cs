using Backend_EnTeck.Models;

namespace Backend_EnTeck.Services
{
    public interface IWhatsAppService
    {
        Task<bool> EnviarNotificacionWebhookAsync(NotificacionOrdenDto dto);
    }
}