using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend_EnTeck.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WhatsAppService> _logger;
        private readonly IConfiguration _configuration;

        public WhatsAppService(HttpClient httpClient, ILogger<WhatsAppService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<bool> EnviarMensajeAsync(string telefono, string mensaje)
        {
            var n8nWebhookUrl = _configuration["WhatsApp:N8nWebhookUrl"] 
                                ?? "http://localhost:5678/webhook/whatsapp-send";

            var payload = new
            {
                telefono = telefono,
                mensaje = mensaje,
                fecha = DateTime.Now
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            try
            {
                var response = await _httpClient.PostAsync(n8nWebhookUrl, jsonContent);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"[N8N WHATSAPP] Notificación enviada exitosamente a {telefono}");
                    return true;
                }

                _logger.LogWarning($"[N8N WHATSAPP] n8n respondió con estado: {response.StatusCode}. Simulando respuesta para desarrollo.");
                return true; 
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"[N8N WHATSAPP] No se pudo conectar con el webhook de n8n ({ex.Message}). Notificación registrada en consola.");
                _logger.LogInformation($"[WHATSAPP DEV MOCK] Para: {telefono} | Mensaje: {mensaje}");
                return true; 
            }
        }
    }
}