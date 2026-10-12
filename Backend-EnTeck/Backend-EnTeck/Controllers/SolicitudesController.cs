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
    // Obtener las solicitudes de servicio para el panel de administración
    [HttpGet("pendientes")]
    public async Task<IActionResult> GetPendientes()
    {
        var solicitudes = await _context.SolicitudesServicio
            .OrderByDescending(s => s.Id)
            .ToListAsync();
            
        return Ok(solicitudes);
    }

    // PUT: api/solicitudes/{id}/asignar
    // US-011: Asignar un técnico a la orden de trabajo
    [HttpPut("{id}/asignar")]
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
        
        if (string.IsNullOrEmpty(orden.Estado) || orden.Estado == "Recibido" || orden.Estado == "Pendiente")
        {
            orden.Estado = "En Proceso";
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Técnico asignado exitosamente.", orden });
    }

    // PUT: api/solicitudes/{id}/estado
    // US-012: Actualizar el estado del equipo y la fecha estimada de entrega (ETA)
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> ActualizarEstado(int id, [FromBody] ActualizarEstadoDto dto)
    {
        var orden = await _context.SolicitudesServicio.FindAsync(id);
        if (orden == null)
        {
            return NotFound(new { mensaje = "La orden de servicio no existe." });
        }

        orden.Estado = dto.Estado;
        if (!string.IsNullOrEmpty(dto.Eta))
        {
            orden.Eta = dto.Eta;
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Estado y ETA actualizados exitosamente.", orden });
    }
}

public class AsignarTecnicoDto
{
    public int IdTecnico { get; set; }
    public string NombreTecnico { get; set; } = string.Empty;
}

public class ActualizarEstadoDto
{
    public string Estado { get; set; } = string.Empty;
    public string? Eta { get; set; }
}