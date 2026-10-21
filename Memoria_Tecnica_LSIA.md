# 🎓 Memoria Técnica y Carpeta Académica LSIA - Proyecto EnTeck
**Asignatura:** Ingeniería de Software / Licenciatura en Sistemas de Información Administrativa (LSIA)  
**Product Owner / Docente:** Mtro. Iván Martínez  
**Equipo de Desarrollo (SCRUM):** Bryan Espinoza, Ángel Ramos, Dante Solórzano, Pablo Medrano, José de Jesús Avilés  
**Versión del Entregable:** v1.0.0 (Sprint 5 Final)  

---

## 1. Resumen Ejecutivo y Alcance
El proyecto **EnTeck** es una plataforma web integral orientada a la gestión de talleres de reparación de equipo de cómputo y electrónica. Permite la recepción de equipos, asignación de diagnósticos, control de refacciones y seguimiento transparente mediante un portal de tracking público y avisos automatizados vía WhatsApp.

---

## 2. Arquitectura de Software e Integraciones (EDA)
La plataforma implementa una **Arquitectura Orientada a Eventos (EDA)** y microservicios desacoplados:
* **Frontend:** Angular 17+ con TypeScript y Guards de seguridad (`AdminGuard`).
* **Backend:** Web API en ASP.NET Core (C#) con Entity Framework Core.
* **Base de Datos:** Microsoft SQL Server local en DBeaver.
* **Automatización Asíncrona:** Motor **n8n** mediante Webhooks y Cronjobs para notificaciones por WhatsApp y generación de reportes semanales gerenciales.

---

## 3. Matriz de Entregables del Proyecto (US-001 a US-021)
| Módulo / Épica | Historia de Usuario | Estado | Evidencias / Archivos |
| :--- | :--- | :---: | :--- |
| **Infraestructura** | US-001 a US-004: Migración SQL Server, Setup ASP.NET Core & Angular | Completado | Repositorio GitHub Base |
| **Seguridad & Roles** | US-009 a US-012: Incorporación de `esAdmin` y AuthGuards | Completado | `Controllers/WhatsAppController.cs` |
| **Automatización n8n** | US-013 a US-017: Workflows de WhatsApp, Encuestas y Reportes | Completado | Integración de Webhooks en C# |
| **Calidad & QA** | US-018: Diseños y Ejecución de Matriz de Pruebas (25 Casos) | Completado | `QA_Matriz_Pruebas.md` |
| **Documentación** | US-019: Elaboración de Manual Técnico y de Usuario Final | Completado | `Manual_Tecnico.md` y `Manual_Usuario.md` |
| **Cierre & Despliegue**| US-020 & US-021: Sprint Review, Demostración PO y Carpeta LSIA | Completado | `Memoria_Tecnica_LSIA.md` |

---

## 4. Acta de Aceptación del Product Owner (Sprint Review Final)
> **Dictamen:** ACEPTADO Y CONFORME  
> **Comentarios:** Se constató el funcionamiento *end-to-end* del sistema (*Registro -> Orden -> Control de Taller `esAdmin` -> Notificación automática por WhatsApp*). Se otorga la firma de conformidad para la culminación del proyecto académico EnTeck.