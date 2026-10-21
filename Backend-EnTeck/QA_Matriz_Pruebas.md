# 📊 Matriz de Pruebas de QA e Integración - Proyecto EnTeck (US-018)

| ID Caso | Módulo / Épica | Tipo de Prueba | Descripción del Escenario | Resultado Esperado | Criterio de Éxito |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-001** | Autenticación | Funcional | Registro de nuevo cliente con datos válidos | Usuario registrado en BD SQL Server y token JWT retornado | PASS |
| **TC-002** | Autenticación | Funcional | Login con credenciales correctas | Retorna HTTP 200 OK y almacena sesión en Angular | PASS |
| **TC-003** | Autenticación | Seguridad | Login con contraseña incorrecta | Retorna HTTP 401 Unauthorized y mensaje de error | PASS |
| **TC-004** | Seguridad (`esAdmin`) | Seguridad | Cliente normal (`esAdmin=false`) intenta acceder a `/admin/dashboard` | `AdminGuard` de Angular redirige a vista cliente | PASS |
| **TC-005** | Seguridad (`esAdmin`) | Seguridad | Administrador (`esAdmin=true`) accede a `/admin/dashboard` | Carga el panel administrativo correctamente | PASS |
| **TC-006** | Seguridad (BOLA/IDOR) | Seguridad | Cliente intenta invocar `PUT /api/ordenes/estado` directamente | Backend ASP.NET Core retorna HTTP 403 Forbidden | PASS |
| **TC-007** | Control de Taller | Funcional | Creación de nueva orden de reparación por técnico | Orden creada con estado `Recibido` y folio asignado | PASS |
| **TC-008** | Control de Taller | Funcional | Actualización de diagnóstico y piezas por el técnico (US-013) | Guarda refacciones y costo estimado en SQL Server | PASS |
| **TC-009** | Control de Taller | Funcional | Cambio de estado de orden a `En Reparación` | Refleja el nuevo estado en el tablero de taller Angular | PASS |
| **TC-010** | Control de Taller | Funcional | Cambio de estado de orden a `Listo` | Notifica al frontend y activa evento para WhatsApp | PASS |
| **TC-011** | Automatización n8n | Integración | Emisión de webhook al cambiar estado de orden (US-014) | n8n recibe el payload JSON en < 2 segundos | PASS |
| **TC-012** | Automatización n8n | Integración | Envío automático de notificación WhatsApp al cliente (US-015) | Mensaje entregado con plantilla oficial y folio | PASS |
| **TC-013** | Automatización n8n | Integración | Disparo de encuesta de satisfacción a las 24 hrs (US-016) | Cronjob de n8n envía encuesta interactiva | PASS |
| **TC-014** | Automatización n8n | Integración | Registro de respuesta de encuesta en BD | Inserta calificación en la tabla `Encuestas` de SQL | PASS |
| **TC-015** | Automatización n8n | Integración / EDA | Ejecución de Cronjob para Reporte Semanal (US-017) | Consulta métricas y envía reporte al WhatsApp admin | PASS |
| **TC-016** | Backend API | Unitaria | Consulta de endpoint `/api/WhatsApp/reporte-semanal` | Retorna JSON con evento `ReporteSemanalGenerado` | PASS |
| **TC-017** | Tracking Público | Funcional | Consulta de estado de equipo mediante folio sin login | Muestra el estado actual sin exponer datos sensibles | PASS |
| **TC-018** | Frontend Angular | UI / UX | Navegación dinámica en sidebar según rol (`esAdmin`) | Muestra únicamente opciones permitidas según el rol | PASS |
| **TC-019** | Frontend Angular | Renders | Carga de formulario de encuesta en Angular | Renderiza estrellas de calificación e insumos | PASS |
| **TC-020** | BD SQL Server | Datos | Validación de migración y tipos de datos en DBeaver | Tablas con PK, FK e índices en SQL Server local | PASS |
| **TC-021** | BD SQL Server | Datos | Alteración de tabla para incluir campo `esAdmin BIT` | Columna creada con valor por defecto `0` sin pérdidas | PASS |
| **TC-022** | Seguridad | Resiliencia | Petición con Token JWT expirado | Retorna HTTP 401 y Angular redirige al Login | PASS |
| **TC-023** | Automatización n8n | Resiliencia | Caída temporal del motor n8n al emitir webhook | Backend no colapsa (asíncrono) y reintenta | PASS |
| **TC-024** | Sistema General | Rendimiento | Respuesta de endpoints API en consultas principales | Tiempo de respuesta medio < 300 ms en local | PASS |
| **TC-025** | Sistema General | E2E | Flujo completo: Registro -> Orden -> Taller -> WhatsApp | Flujo ejecutado exitosamente de principio a fin | PASS |