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
    [HttpGet("pendientes")]
    public async Task<IActionResult> GetPendientes()
    {
        var solicitudes = await _context.SolicitudesServicio
            .OrderByDescending(s => s.Id)
            .ToListAsync();
            
        return Ok(solicitudes);
    }

    // GET: api/solicitudes/cliente/2
    [HttpGet("cliente/{clienteId}")]
    public async Task<IActionResult> GetPorCliente(int clienteId)
    {
        var solicitudes = await _context.SolicitudesServicio
            .Where(s => s.IdCliente == clienteId)
            .OrderByDescending(s => s.Id)
            .ToListAsync();

        return Ok(solicitudes);
    }

    // PUT/POST: api/solicitudes/{id}/asignar
    [HttpPut("{id}/asignar")]
    [HttpPost("{id}/asignar")]
    public async Task<IActionResult> AsignarTecnico(int id, [FromBody] ActualizarOrdenDto dto)
    {
        var orden = await _context.SolicitudesServicio.FindAsync(id);
        if (orden == null)
        {
            return NotFound(new { mensaje = "La orden de servicio no existe." });
        }

        if (dto.IdTecnico.HasValue && dto.IdTecnico.Value > 0)
        {
            orden.IdTecnico = dto.IdTecnico;
            orden.NombreTecnico = dto.NombreTecnico;
            orden.FechaAsignacion = DateTime.Now;
        }

        if (!string.IsNullOrWhiteSpace(dto.Estado))
        {
            orden.Estado = dto.Estado;
        }
        else if (string.IsNullOrEmpty(orden.Estado) || orden.Estado == "Recibido" || orden.Estado == "Pendiente")
        {
            orden.Estado = "En Proceso";
        }

        if (!string.IsNullOrWhiteSpace(dto.Eta))
        {
            if (DateTime.TryParse(dto.Eta, out var fechaParseada))
            {
                orden.Eta = fechaParseada;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Orden actualizada exitosamente.", orden });
    }
}

public class ActualizarOrdenDto
{
    public int? IdTecnico { get; set; }
    public string? NombreTecnico { get; set; }
    public string? Estado { get; set; }
    public string? Eta { get; set; }
}