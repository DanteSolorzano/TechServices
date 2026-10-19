using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_EnTeck.Data;
using Backend_EnTeck.Models;

namespace Backend_EnTeck.Controllers
{
    public class LoginRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClientesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/clientes
        [HttpGet]
        public async Task<IActionResult> GetClientes()
        {
            try
            {
                var usuarios = await _context.Users.ToListAsync();
                return Ok(usuarios);
            }
            catch
            {
                // Fallback directo por si la columna rol o algún dato causa conflicto de mapeo
                var usuariosRaw = await _context.Database
                    .SqlQueryRaw<User>(@"
                        SELECT 
                            [c].[id] AS [Id], 
                            [c].[nombre] AS [Nombre], 
                            [c].[correo] AS [Correo], 
                            [c].[telefono] AS [Telefono], 
                            [c].[contrasena] AS [Contrasena], 
                            ISNULL([c].[direccion], '') AS [Direccion], 
                            [c].[esAdmin] AS [EsAdmin],
                            ISNULL([c].[rol], CASE WHEN [c].[esAdmin] = 1 THEN 'admin' ELSE 'cliente' END) AS [Rol]
                        FROM [Clientes] AS [c]")
                    .ToListAsync();

                return Ok(usuariosRaw);
            }
        }

        // POST: api/clientes/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Contrasena))
            {
                return BadRequest(new { mensaje = "El correo y la contraseña son requeridos." });
            }

            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Correo.ToLower() == request.Correo.ToLower().Trim() && u.Contrasena == request.Contrasena);

                if (user == null)
                {
                    return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
                }

                string rolFinal = string.IsNullOrWhiteSpace(user.Rol) 
                    ? (user.EsAdmin ? "admin" : "cliente") 
                    : user.Rol;

                return Ok(new
                {
                    id = user.Id,
                    nombre = user.Nombre,
                    correo = user.Correo,
                    esAdmin = user.EsAdmin,
                    rol = rolFinal
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error en inicio de sesión", detalle = ex.Message });
            }
        }

        // POST: api/clientes
        [HttpPost]
        public async Task<IActionResult> RegistrarCliente([FromBody] User usuario)
        {
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Nombre) || string.IsNullOrWhiteSpace(usuario.Correo))
            {
                return BadRequest(new { mensaje = "El nombre y el correo son obligatorios." });
            }

            try
            {
                if (string.IsNullOrWhiteSpace(usuario.Rol))
                {
                    usuario.Rol = usuario.EsAdmin ? "admin" : "cliente";
                }

                if (string.IsNullOrWhiteSpace(usuario.Contrasena))
                {
                    usuario.Contrasena = "123456";
                }

                _context.Users.Add(usuario);
                await _context.SaveChangesAsync();

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al guardar el usuario", detalle = ex.Message });
            }
        }
    }
}