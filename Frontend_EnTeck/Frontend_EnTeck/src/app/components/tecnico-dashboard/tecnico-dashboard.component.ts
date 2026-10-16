import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceOrderService, ServiceOrder } from '../../services/service-order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tecnico-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <h2>Panel de Trabajo para Técnicos (US-012 / US-013 / US-015)</h2>

      @if (loading()) {
        <p class="loading-text">Cargando órdenes asignadas...</p>
      } @else if (ordenes().length === 0) {
        <div class="empty-state">
          <p>📦 No tienes órdenes asignadas pendientes en este momento.</p>
        </div>
      } @else {
        <div class="orders-grid">
          @for (orden of ordenes(); track orden.id) {
            <div class="order-card">
              <div class="order-header">
                <span class="order-id">#{{ orden.id }}</span>
                <span class="order-date">{{ orden.fechaRecibido | date:'dd/MM/yy' }}</span>
              </div>

              <h3>{{ orden.marca }} {{ orden.modelo }}</h3>
              <p class="problem-text"><strong>Falla reportada:</strong> {{ orden.problema }}</p>

              <!-- US-013: Formulario de Diagnóstico y Piezas -->
              <div class="form-group">
                <label>Diagnóstico Técnico:</label>
                <textarea 
                  [(ngModel)]="orden.diagnostico" 
                  rows="3" 
                  placeholder="Escribe las causas de la falla...">
                </textarea>
              </div>

              <div class="form-group">
                <label>Piezas Utilizadas:</label>
                <textarea 
                  [(ngModel)]="orden.piezasUtilizadas" 
                  rows="2" 
                  placeholder="Ej: Pasta térmica, pantalla, memoria RAM...">
                </textarea>
              </div>

              <!-- Actualizar Estado -->
              <div class="form-group">
                <label>Actualizar Estado:</label>
                <select [(ngModel)]="orden.estado">
                  <option value="En Proceso">🟡 En Proceso</option>
                  <option value="Listo para Entrega">🟢 Listo para Entrega</option>
                  <option value="Entregado">🔵 Entregado</option>
                  <option value="Cancelado">🔴 Cancelado</option>
                </select>
              </div>

              <div class="actions-group">
                <button class="btn-save" (click)="guardarProgreso(orden)">
                  💾 Guardar Diagnóstico y Estado
                </button>
                <button class="btn-whatsapp" (click)="enviarWhatsApp(orden)">
                  📱 Notificar por WhatsApp
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 2rem; max-width: 1200px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
    h2 { color: #333; margin-bottom: 1.5rem; }
    .loading-text { text-align: center; font-size: 1.1rem; color: #666; }
    .empty-state { text-align: center; padding: 3rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); color: #666; }
    .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .order-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-left: 5px solid #00e5ff; }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .order-id { font-weight: bold; background: #1a1a1a; color: #00e5ff; padding: 4px 10px; border-radius: 6px; font-size: 0.9rem; }
    .order-date { color: #888; font-size: 0.85rem; }
    .problem-text { background: #f8f9fa; padding: 10px; border-radius: 6px; color: #555; font-size: 0.9rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 5px; }
    .form-group label { font-size: 0.85rem; font-weight: bold; color: #444; }
    textarea, select { width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; box-sizing: border-box; }
    .actions-group { display: flex; flex-direction: column; gap: 8px; margin-top: 1.5rem; }
    .btn-save { background: #28a745; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    .btn-save:hover { background: #218838; }
    .btn-whatsapp { background: #25D366; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    .btn-whatsapp:hover { background: #1ebc57; }
  `]
})
export class TecnicoDashboardComponent implements OnInit {
  private orderService = inject(ServiceOrderService);
  private authService = inject(AuthService);

  ordenes = signal<ServiceOrder[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.loading.set(true);

    const currentUser = this.authService.getCurrentUser();
    const tecnicoId = currentUser?.id ? Number(currentUser.id) : 0;

    this.orderService.getOrdenesPorTecnico(tecnicoId).subscribe({
      next: (data) => {
        this.ordenes.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar órdenes:', err);
        this.loading.set(false);
      }
    });
  }

  guardarProgreso(orden: ServiceOrder): void {
    const diagnosticoText = orden.diagnostico || 'Sin diagnóstico registrado.';
    const piezasText = orden.piezasUtilizadas || 'Ninguna';
    const estadoText = orden.estado || 'En Proceso';

    this.orderService.registrarDiagnostico(orden.id, diagnosticoText, piezasText, estadoText).subscribe({
      next: () => {
        alert(`¡Diagnóstico y estado guardados correctamente para la orden #${orden.id}!`);
        this.cargarOrdenes();
      },
      error: (err) => {
        console.error('Error al guardar progreso:', err);
        alert(`¡Error al guardar la orden #${orden.id}! Intenta nuevamente.`);
      }
    });
  }

  enviarWhatsApp(orden: ServiceOrder): void {
    const estado = orden.estado || 'En Proceso';
    const equipo = `${orden.marca || ''} ${orden.modelo || ''}`.trim();
    const diagnostico = orden.diagnostico || 'En revisión técnica.';

    let rawTelefono = (orden as any).telefonoCliente || (orden as any).telefono || '';

    if (!rawTelefono) {
      const ingresado = prompt(`Ingresa el número de teléfono del cliente para la orden #${orden.id}:`, '4731234567');
      if (!ingresado) return;
      rawTelefono = ingresado;
    }

    let numeroLimpio = rawTelefono.replace(/\D/g, '');

    if (numeroLimpio.length === 10) {
      numeroLimpio = `52${numeroLimpio}`;
    }

    const mensaje = encodeURIComponent(
      `Hola! Te contactamos de EnTeck para informarte sobre tu equipo ${equipo} (Orden #${orden.id}).\n\n` +
      `Estado actual: *${estado}*\n` +
      `Diagnóstico: ${diagnostico}\n\n` +
      `Puedes consultar el avance ingresando tu folio en nuestro portal de rastreo público.`
    );

    const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${mensaje}`;
    window.open(urlWhatsApp, '_blank');
  }
}