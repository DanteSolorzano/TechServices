using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using TechServices.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TechServices.Services;

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

    public async Task<bool> EnviarNotificacionWebhookAsync(NotificacionOrdenDto dto)
    {
        // Apunta a la URL de n8n configurada en appsettings
        var n8nWebhookUrl = _configuration["WhatsApp:N8nWebhookUrl"] 
                            ?? "http://localhost:5678/webhook-test/notificar-orden";

        var jsonContent = new StringContent(
            JsonSerializer.Serialize(dto),
            Encoding.UTF8,
            "application/json"
        );

        try
        {
            var response = await _httpClient.PostAsync(n8nWebhookUrl, jsonContent);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"[N8N WHATSAPP] Notificación enviada exitosamente para cliente: {dto.Cliente} ({dto.Telefono})");
                return true;
            }

            _logger.LogWarning($"[N8N WHATSAPP] n8n respondió con estado HTTP: {response.StatusCode}");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError($"[N8N WHATSAPP] Error de conexión con n8n: {ex.Message}");
            return false;
        }
    }
}