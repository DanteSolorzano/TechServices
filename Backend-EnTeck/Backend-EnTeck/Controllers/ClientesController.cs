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
            var usuarios = await _context.Users.ToListAsync();
            return Ok(usuarios);
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
                // Validar nivelPrivilegio: 0 = admin, 1 = tecnico, 2 = cliente
                if (usuario.NivelPrivilegio < 0 || usuario.NivelPrivilegio > 2)
                {
                    usuario.NivelPrivilegio = 2; // Por defecto: cliente
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

                // PUT: api/clientes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCliente(int id, [FromBody] User usuarioActualizado)
        {
            if (usuarioActualizado == null)
            {
                return BadRequest(new { mensaje = "Datos del usuario inválidos." });
            }

            try
            {
                var usuario = await _context.Users.FindAsync(id);
                if (usuario == null)
                {
                    return NotFound(new { mensaje = "Usuario no encontrado." });
                }

                // Actualizar campos (Evitamos actualizar la contraseña desde aquí para mayor seguridad)
                usuario.Nombre = usuarioActualizado.Nombre;
                usuario.Correo = usuarioActualizado.Correo;
                usuario.Telefono = usuarioActualizado.Telefono;
                usuario.Direccion = usuarioActualizado.Direccion;
                usuario.NivelPrivilegio = usuarioActualizado.NivelPrivilegio;

                await _context.SaveChangesAsync();

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar el usuario", detalle = ex.Message });
            }
        }

        // DELETE: api/clientes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            try
            {
                var usuario = await _context.Users.FindAsync(id);
                if (usuario == null)
                {
                    return NotFound(new { mensaje = "Usuario no encontrado." });
                }

                _context.Users.Remove(usuario);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Usuario eliminado correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar el usuario", detalle = ex.Message });
            }
        }
    }
}