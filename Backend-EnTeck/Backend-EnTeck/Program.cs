using Backend_EnTeck.Data;
using Backend_EnTeck.Models;
using Microsoft.EntityFrameworkCore;
using Backend_EnTeck.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registrar HttpClient y WhatsAppService (US-014)
builder.Services.AddHttpClient<IWhatsAppService, WhatsAppService>();

// Registrar controladores para rutas atribuidas ([ApiController])
builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.MapControllers();

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

app.MapPost("/api/auth/signup", async (SignupRequest request, ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Nombre) || 
        string.IsNullOrWhiteSpace(request.Telefono) || 
        string.IsNullOrWhiteSpace(request.Correo) || 
        string.IsNullOrWhiteSpace(request.Contrasena))
    {
        return Results.BadRequest(new { message = "Nombre, Telefono, Correo, and Contrasena are required" });
    }

    var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Correo == request.Correo);
    if (existingUser != null)
    {
        return Results.Conflict(new { message = "Email already registered" });
    }

    var user = new User
    {
        Nombre = request.Nombre,
        Telefono = request.Telefono,
        Correo = request.Correo,
        Contrasena = request.Contrasena,
        Direccion = request.Direccion
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created($"/api/auth/signup/{user.Id}", new { id = user.Id, correo = user.Correo, nombre = user.Nombre });
})
.WithName("Signup")
.WithOpenApi();

app.MapPost("/api/auth/login", async (SignupRequest request, ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Correo) || string.IsNullOrWhiteSpace(request.Contrasena))
    {
        return Results.BadRequest(new { message = "Correo and Contrasena are required" });
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.Correo == request.Correo);
    if (user == null || user.Contrasena != request.Contrasena)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new { id = user.Id });
})
.WithName("Login")
.WithOpenApi();


// ----------------------------------------------------
// CLIENTS ENDPOINTS
// ----------------------------------------------------

app.MapGet("/api/clientes", async (ApplicationDbContext db) =>
{
    var clientes = await db.Users.Select(u => new
    {
        id = u.Id,
        nombre = u.Nombre,
        telefono = u.Telefono,
        correo = u.Correo,
        direccion = u.Direccion,
        esAdmin = u.EsAdmin
    }).ToListAsync();

    return Results.Ok(clientes);
})
.WithName("GetAllClientes")
.WithOpenApi();

app.MapGet("/api/clients", async (ApplicationDbContext db) =>
{
    var clientes = await db.Users.Select(u => new
    {
        id = u.Id,
        nombre = u.Nombre,
        telefono = u.Telefono,
        correo = u.Correo,
        direccion = u.Direccion,
        esAdmin = u.EsAdmin
    }).ToListAsync();

    return Results.Ok(clientes);
})
.WithName("GetAllClients")
.WithOpenApi();

app.MapGet("/api/clients/{id}", async (int id, ApplicationDbContext db) =>
{
    var cliente = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
    if (cliente == null) return Results.NotFound(new { message = "Cliente not found" });

    return Results.Ok(new
    {
        id = cliente.Id,
        nombre = cliente.Nombre,
        telefono = cliente.Telefono,
        correo = cliente.Correo,
        direccion = cliente.Direccion,
        esAdmin = cliente.EsAdmin
    });
})
.WithName("GetClientInfo")
.WithOpenApi();

app.MapGet("/api/clientes/{id}", async (int id, ApplicationDbContext db) =>
{
    var cliente = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
    if (cliente == null) return Results.NotFound(new { message = "Cliente not found" });

    return Results.Ok(new
    {
        id = cliente.Id,
        nombre = cliente.Nombre,
        telefono = cliente.Telefono,
        correo = cliente.Correo,
        direccion = cliente.Direccion,
        esAdmin = cliente.EsAdmin
    });
})
.WithName("GetClienteInfoEs")
.WithOpenApi();

app.MapDelete("/api/clients/{id}", async (int id, ApplicationDbContext db) =>
{
    var cliente = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
    if (cliente == null) return Results.NotFound(new { message = "Cliente not found" });

    db.Users.Remove(cliente);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Cliente deleted successfully" });
})
.WithName("DeleteClient")
.WithOpenApi();

app.MapDelete("/api/clientes/{id}", async (int id, ApplicationDbContext db) =>
{
    var cliente = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
    if (cliente == null) return Results.NotFound(new { message = "Cliente not found" });

    db.Users.Remove(cliente);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Cliente deleted successfully" });
})
.WithName("DeleteClienteEs")
.WithOpenApi();


// ----------------------------------------------------
// SERVICE ORDERS ENDPOINTS
// ----------------------------------------------------

app.MapGet("/api/service-order", async (ApplicationDbContext db) =>
{
    var solicitudes = await db.SolicitudesServicio.ToListAsync();
    
    var resultado = solicitudes.Select(s => new 
    { 
        id = s.Id, 
        marca = s.Marca,
        modelo = s.Modelo,
        problema = s.Problema,
        estado = s.Estado,
        fechaRecibido = s.FechaRecibido,
        eta = s.Eta,
        idCliente = s.IdCliente,
        idTecnico = s.IdTecnico,
        nombreTecnico = s.NombreTecnico,
        fechaAsignacion = s.FechaAsignacion
    }).ToList();

    return Results.Ok(resultado);
})
.WithName("GetAllServiceOrders")
.WithOpenApi();
app.MapGet("/api/service-order/{id}", async (int id, ApplicationDbContext db) =>
{
    var solicitud = await db.SolicitudesServicio.FirstOrDefaultAsync(s => s.Id == id);
    if (solicitud == null) 
    {
        return Results.NotFound(new { message = "Orden no encontrada" });
    }

    return Results.Ok(new 
    { 
        id = solicitud.Id, 
        marca = solicitud.Marca,
        modelo = solicitud.Modelo,
        problema = solicitud.Problema,
        estado = solicitud.Estado,
        fechaRecibido = solicitud.FechaRecibido,
        eta = solicitud.Eta,
        idCliente = solicitud.IdCliente,
        idTecnico = solicitud.IdTecnico,
        nombreTecnico = solicitud.NombreTecnico,
        fechaAsignacion = solicitud.FechaAsignacion
    });
})
.WithName("GetServiceOrderById")
.WithOpenApi();

app.MapGet("/api/service-order/client/{idCliente}", async (int idCliente, ApplicationDbContext db) =>
{
    var solicitudes = await db.SolicitudesServicio
        .Where(s => s.IdCliente == idCliente)
        .ToListAsync();
    
    var resultado = solicitudes.Select(s => new 
    { 
        id = s.Id, 
        marca = s.Marca,
        modelo = s.Modelo,
        problema = s.Problema,
        estado = s.Estado,
        fechaRecibido = s.FechaRecibido,
        eta = s.Eta,
        idCliente = s.IdCliente,
        idTecnico = s.IdTecnico,
        nombreTecnico = s.NombreTecnico,
        fechaAsignacion = s.FechaAsignacion
    }).ToList();

    return Results.Ok(resultado);
})
.WithName("GetServiceOrdersByClient")
.WithOpenApi();

app.MapPost("/api/service-order", async (ServiceOrderRequest request, ApplicationDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Marca) || 
        string.IsNullOrWhiteSpace(request.Modelo) || 
        string.IsNullOrWhiteSpace(request.Problema) ||
        string.IsNullOrWhiteSpace(request.Estado) ||
        request.IdCliente <= 0)
    {
        return Results.BadRequest(new { message = "Marca, Modelo, Problema, Estado, and IdCliente are required" });
    }

    var cliente = await db.Users.FirstOrDefaultAsync(u => u.Id == request.IdCliente);
    if (cliente == null)
    {
        return Results.NotFound(new { message = "Cliente not found" });
    }

    var solicitud = new SolicitudServicio
    {
        Marca = request.Marca,
        Modelo = request.Modelo,
        Problema = request.Problema,
        Estado = request.Estado,
        FechaRecibido = DateTime.Now,
        Eta = request.Eta,
        IdCliente = request.IdCliente
    };

    db.SolicitudesServicio.Add(solicitud);
    await db.SaveChangesAsync();

    return Results.Created($"/api/service-order/{solicitud.Id}", new 
    { 
        id = solicitud.Id, 
        marca = solicitud.Marca,
        modelo = solicitud.Modelo,
        problema = solicitud.Problema,
        estado = solicitud.Estado,
        fechaRecibido = solicitud.FechaRecibido,
        eta = solicitud.Eta,
        idCliente = solicitud.IdCliente
    });
})
.WithName("CreateServiceOrder")
.WithOpenApi();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}