# 🛠️ Manual Técnico de Arquitectura y Mantenimiento - Proyecto EnTeck (US-019)

## 1. Visión General de la Arquitectura
El sistema **EnTeck** está diseñado bajo una arquitectura desacoplada y orientada a servicios:
* **Frontend:** Angular 17+ (TypeScript, CSS modular, Guards de navegación como `AdminGuard`).
* **Backend:** ASP.NET Core Web API (C#, Entity Framework Core, SQL Server).
* **Automatización e Integraciones (EDA):** Motor n8n y Webhooks asíncronos para notificaciones de WhatsApp.

---

## 2. Requisitos del Entorno de Desarrollo
* **SDK / Runtime:** .NET 8.0 / 10.0 SDK
* **Node.js:** v18.x o superior / Angular CLI (`npm install -g @angular/cli`)
* **Base de Datos:** Microsoft SQL Server 2019+ / DBeaver
* **Motor de Automatización:** Instance n8n (Docker o servicio Nube)

---

## 3. Configuración del Backend (ASP.NET Core)
1. Ubicación: `Backend-EnTeck/Backend-EnTeck/`
2. Configuración de cadena de conexión (`appsettings.json`):
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=EnTeckDB;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }