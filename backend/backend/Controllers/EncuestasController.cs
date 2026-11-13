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

        var existeEncuesta = await _context.EncuestasSatisfaccion
            .AnyAsync(e => e.IdSolicitud == dto.IdSolicitud);

        if (existeEncuesta)
        {
            return Conflict(new { mensaje = "Esta orden de servicio ya ha sido calificada." });
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
        // Hacemos un Join para obtener los datos del cliente y del dispositivo
        var query = from e in _context.EncuestasSatisfaccion
                    join s in _context.SolicitudesServicio on e.IdSolicitud equals s.Id
                    join u in _context.Users on s.IdCliente equals u.Id
                    orderby e.FechaRespuesta descending
                    select new
                    {
                        id = e.Id,
                        calificacion = e.Calificacion,
                        comentarios = e.Comentarios,
                        fechaRespuesta = e.FechaRespuesta,
                        nombreCliente = u.Nombre,
                        dispositivo = $"{s.Marca} {s.Modelo}",
                        problema = s.Problema // <-- NUEVA LÍNEA

                    };

        var encuestas = await query.Take(6).ToListAsync(); // Traemos las últimas 6

        if (!encuestas.Any())
        {
            return Ok(new
            {
                promedio = 0.0,
                totalRespuestas = 0,
                encuestas = new List<object>()
            });
        }

        // Calculamos el promedio general en base a todas las encuestas
        var todasLasEncuestas = await _context.EncuestasSatisfaccion.ToListAsync();
        var promedio = todasLasEncuestas.Average(e => e.Calificacion);

        return Ok(new
        {
            promedio = Math.Round(promedio, 2),
            totalRespuestas = todasLasEncuestas.Count,
            encuestas = encuestas
        });
    }
}

public class RegistrarEncuestaDto
{
    public int IdSolicitud { get; set; }
    public int Calificacion { get; set; }
    public string Comentarios { get; set; } = string.Empty;
}