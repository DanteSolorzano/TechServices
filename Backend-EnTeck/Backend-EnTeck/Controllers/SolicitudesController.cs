using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_EnTeck.Data;
using Backend_EnTeck.Models;

namespace Backend_EnTeck.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SolicitudesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SolicitudesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/solicitudes/pendientes
    // Obtener las solicitudes sin técnico asignado
    [HttpGet("pendientes")]
    public async Task<IActionResult> GetPendientes()
    {
        var pendientes = await _context.SolicitudesServicio
            .Where(s => s.IdTecnico == null)
            .ToListAsync();
        return Ok(pendientes);
    }

    // POST: api/solicitudes/{id}/asignar
    // US-011: Asignar un técnico a la orden de trabajo
    [HttpPost("{id}/asignar")]
    public async Task<IActionResult> AsignarTecnico(int id, [FromBody] AsignarTecnicoDto dto)
    {
        var orden = await _context.SolicitudesServicio.FindAsync(id);
        if (orden == null)
        {
            return NotFound(new { mensaje = "La orden de servicio no existe." });
        }

        orden.IdTecnico = dto.IdTecnico;
        orden.NombreTecnico = dto.NombreTecnico;
        orden.FechaAsignacion = DateTime.Now;
        
        if (string.IsNullOrEmpty(orden.Estado) || orden.Estado == "Recibido")
        {
            orden.Estado = "En Diagnóstico";
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Técnico asignado exitosamente.", orden });
    }
}

public class AsignarTecnicoDto
{
    public int IdTecnico { get; set; }
    public string NombreTecnico { get; set; } = string.Empty;
}