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

    // GET: api/solicitudes/tecnico/13 (US-012 / US-013)
    [HttpGet("tecnico/{tecnicoId}")]
    public async Task<IActionResult> GetPorTecnico(int tecnicoId)
    {
        // CORREGIDO: Solo trae las órdenes que están asignadas estrictamente a este técnico.
        var solicitudes = await _context.SolicitudesServicio
            .Where(s => s.IdTecnico == tecnicoId)
            .OrderByDescending(s => s.Id)
            .ToListAsync();

        return Ok(solicitudes);
    }

    // GET: api/solicitudes/public/tracking/2 (US-015)
    [HttpGet("public/tracking/{id:int}")]
    public async Task<IActionResult> GetPublicTracking(int id)
    {
        var solicitud = await _context.SolicitudesServicio.FirstOrDefaultAsync(s => s.Id == id);
        if (solicitud == null)
        {
            return NotFound(new { message = "Orden de servicio no encontrada" });
        }

        return Ok(new
        {
            id = solicitud.Id,
            marca = solicitud.Marca,
            modelo = solicitud.Modelo,
            problema = solicitud.Problema,
            estado = solicitud.Estado,
            fechaRecibido = solicitud.FechaRecibido,
            eta = solicitud.Eta,
            nombreTecnico = solicitud.NombreTecnico
        });
    }

    // GET: api/solicitudes/reporte-rendimiento (US-016)
    [HttpGet("reporte-rendimiento")]
    public async Task<IActionResult> GetReporteRendimiento([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var query = _context.SolicitudesServicio.AsQueryable();

        if (fechaInicio.HasValue)
            query = query.Where(s => s.FechaRecibido >= fechaInicio.Value);

        if (fechaFin.HasValue)
            query = query.Where(s => s.FechaRecibido <= fechaFin.Value);

        var solicitudes = await query.ToListAsync();

        var totalOrdenes = solicitudes.Count;
        var completadas = solicitudes.Count(s => s.Estado == "Entregado" || s.Estado == "Reparado" || s.Estado == "Completado");
        var enProceso = solicitudes.Count(s => s.Estado == "En Diagnóstico" || s.Estado == "En Reparación" || s.Estado == "En Proceso");
        var pendientes = solicitudes.Count(s => s.Estado == "Recibido" || s.Estado == "Pendiente" || string.IsNullOrEmpty(s.Estado));

        // Métrica por técnicos
        var rendimientoTecnicos = solicitudes
            .Where(s => s.IdTecnico.HasValue && s.IdTecnico.Value > 0)
            .GroupBy(s => new { IdTecnico = s.IdTecnico!.Value, Nombre = string.IsNullOrWhiteSpace(s.NombreTecnico) ? "Técnico General" : s.NombreTecnico })
            .Select(g => new RendimientoTecnicoDto
            {
                TecnicoId = g.Key.IdTecnico,
                NombreTecnico = g.Key.Nombre,
                OrdenesAsignadas = g.Count(),
                OrdenesFinalizadas = g.Count(s => s.Estado == "Entregado" || s.Estado == "Reparado" || s.Estado == "Completado"),
                OrdenesEnProceso = g.Count(s => s.Estado == "En Diagnóstico" || s.Estado == "En Reparación" || s.Estado == "En Proceso")
            })
            .ToList();

        var reporte = new ReporteRendimientoDto
        {
            TotalOrdenes = totalOrdenes,
            Completadas = completadas,
            EnProceso = enProceso,
            Pendientes = pendientes,
            RendimientoTecnicos = rendimientoTecnicos
        };

        return Ok(reporte);
    }

    // PUT/POST: api/solicitudes/{id}/asignar (US-011)
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

    // PUT: api/solicitudes/{id}/diagnostico (US-013)
    [HttpPut("{id}/diagnostico")]
    public async Task<IActionResult> RegistrarDiagnostico(int id, [FromBody] RegistrarDiagnosticoDto dto)
    {
        var orden = await _context.SolicitudesServicio.FindAsync(id);
        if (orden == null)
        {
            return NotFound(new { mensaje = "La orden de servicio no existe." });
        }

        orden.Diagnostico = dto.Diagnostico;
        orden.PiezasUtilizadas = dto.PiezasUtilizadas;

        if (!string.IsNullOrWhiteSpace(dto.Estado))
        {
            orden.Estado = dto.Estado;
        }

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Diagnóstico y piezas registradas correctamente.", orden });
    }
}

public class ActualizarOrdenDto
{
    public int? IdTecnico { get; set; }
    public string? NombreTecnico { get; set; }
    public string? Estado { get; set; }
    public string? Eta { get; set; }
}

public class RegistrarDiagnosticoDto
{
    public string Diagnostico { get; set; } = string.Empty;
    public string PiezasUtilizadas { get; set; } = string.Empty;
    public string? Estado { get; set; }
}

public class ReporteRendimientoDto
{
    public int TotalOrdenes { get; set; }
    public int Completadas { get; set; }
    public int EnProceso { get; set; }
    public int Pendientes { get; set; }
    public List<RendimientoTecnicoDto> RendimientoTecnicos { get; set; } = new();
}

public class RendimientoTecnicoDto
{
    public int TecnicoId { get; set; }
    public string NombreTecnico { get; set; } = string.Empty;
    public int OrdenesAsignadas { get; set; }
    public int OrdenesFinalizadas { get; set; }
    public int OrdenesEnProceso { get; set; }
}