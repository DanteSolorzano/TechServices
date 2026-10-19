using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_EnTeck.Data;
using Backend_EnTeck.Models;

namespace Backend_EnTeck.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EncuestasController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EncuestasController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/encuestas
    [HttpPost]
    public async Task<IActionResult> RegistrarEncuesta([FromBody] RegistrarEncuestaDto dto)
    {
        if (dto.Calificacion < 1 || dto.Calificacion > 5)
        {
            return BadRequest(new { mensaje = "La calificación debe ser entre 1 y 5 estrellas." });
        }

        var encuesta = new EncuestaSatisfaccion
        {
            IdSolicitud = dto.IdSolicitud,
            Calificacion = dto.Calificacion,
            Comentarios = dto.Comentarios,
            FechaRespuesta = DateTime.Now
        };

        _context.EncuestasSatisfaccion.Add(encuesta);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "¡Gracias por tu evaluación!", encuesta });
    }

    // GET: api/encuestas/promedio
    [HttpGet("promedio")]
    public async Task<IActionResult> GetPromedioYResumen()
    {
        var encuestas = await _context.EncuestasSatisfaccion.ToListAsync();

        if (!encuestas.Any())
        {
            return Ok(new
            {
                promedio = 0.0,
                totalRespuestas = 0,
                encuestas = new List<object>()
            });
        }

        var promedio = encuestas.Average(e => e.Calificacion);

        return Ok(new
        {
            promedio = Math.Round(promedio, 2),
            totalRespuestas = encuestas.Count,
            encuestas = encuestas.OrderByDescending(e => e.FechaRespuesta).Take(10)
        });
    }
}

public class RegistrarEncuestaDto
{
    public int IdSolicitud { get; set; }
    public int Calificacion { get; set; }
    public string Comentarios { get; set; } = string.Empty;
}