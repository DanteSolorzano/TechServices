namespace Backend_EnTeck.Services;

public interface IWhatsAppService
{
    Task<bool> EnviarMensajeAsync(string numeroTelefono, string mensaje);
}