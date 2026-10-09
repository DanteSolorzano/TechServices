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

    // ==========================================
    // US-011: REPARTO Y ASIGNACIÓN DE ÓRDENES
    // ==========================================

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
    // Asignar un técnico a la orden de trabajo
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

    // ==========================================
    // US-012: PANTALLA DE TRABAJO PARA TÉCNICOS
    // ==========================================

    // GET: api/solicitudes/tecnico/{tecnicoId}
    // Obtener únicamente las órdenes asignadas a un técnico específico
    [HttpGet("tecnico/{tecnicoId}")]
    public async Task<IActionResult> GetOrdenesPorTecnico(int tecnicoId)
    {
        var ordenes = await _context.SolicitudesServicio
            .Where(s => s.IdTecnico == tecnicoId)
            .ToListAsync();
        return Ok(ordenes);
    }

    // PUT: api/solicitudes/{id}/estado
    // Actualizar el avance/estado de la reparación (En Diagnóstico -> Listo)
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> ActualizarEstado(int id, [FromBody] CambiarEstadoDto dto)
    {
        var orden = await _context.SolicitudesServicio.FindAsync(id);
        if (orden == null)
        {
            return NotFound(new { mensaje = "La orden de servicio no existe." });
        }

        orden.Estado = dto.NuevoEstado;
        await _context.SaveChangesAsync();
        
        return Ok(new { mensaje = "Estado de la orden actualizado exitosamente.", orden });
    }
}

// DTOs para transferencia de datos
public class AsignarTecnicoDto
{
    public int IdTecnico { get; set; }
    public string NombreTecnico { get; set; } = string.Empty;
}

public class CambiarEstadoDto
{
    public string NuevoEstado { get; set; } = string.Empty;
}