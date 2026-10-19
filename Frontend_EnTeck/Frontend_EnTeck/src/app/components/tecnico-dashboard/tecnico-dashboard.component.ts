import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceOrderService, ServiceOrder } from '../../services/service-order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tecnico-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-dashboard.component.html',
  styles: [`
    .tech-panel-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif;
      box-sizing: border-box;
    }

    .tech-header {
      background-color: #1a1a1a;
      color: #ffffff;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .tech-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .grid-orders {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card-order {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-left: 5px solid #007bff;
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }

    .folio-badge {
      font-weight: bold;
      font-size: 1.1rem;
      color: #007bff;
    }

    .fecha-label {
      font-size: 0.85rem;
      color: #666;
    }

    .device-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .device-name {
      font-size: 1.1rem;
      font-weight: bold;
      color: #222;
    }

    .problem-desc {
      font-size: 0.9rem;
      color: #444;
    }

    .form-body {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 6px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label-custom {
      font-size: 0.85rem;
      font-weight: bold;
      color: #333;
    }

    .text-area-custom, .status-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.88rem;
      box-sizing: border-box;
    }

    .text-area-custom:focus, .status-select:focus {
      outline: none;
      border-color: #007bff;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .btn-action {
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-save {
      background-color: #007bff;
      color: #ffffff;
    }

    .btn-save:hover {
      background-color: #0056b3;
    }

    .btn-whatsapp {
      background-color: #25d366;
      color: #ffffff;
    }

    .btn-whatsapp:hover {
      background-color: #1eb854;
    }

    .btn-whatsapp:disabled {
      background-color: #a5d6a7;
      cursor: not-allowed;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      color: #777;
      padding: 3rem;
      background: #ffffff;
      border-radius: 8px;
      border: 1px dashed #ccc;
    }
  `]
})
export class TecnicoDashboardComponent implements OnInit {
  private serviceOrderService = inject(ServiceOrderService);
  private authService = inject(AuthService);

  misOrdenes = signal<ServiceOrder[]>([]);
  cargando = signal<boolean>(true);
  notificandoMap = signal<{ [key: number]: boolean }>({});

  ngOnInit() {
    this.cargarMisOrdenes();
  }

  cargarMisOrdenes() {
    this.cargando.set(true);
    const user = this.authService.getCurrentUser();
    const tecnicoId = user?.id || 13;

    this.serviceOrderService.getOrdenesPorTecnico(tecnicoId).subscribe({
      next: (ordenes) => {
        this.misOrdenes.set(ordenes || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar órdenes del técnico:', err);
        this.cargando.set(false);
      }
    });
  }

  cambiarEstado(ordenId: number, event: Event) {
    const select = event.target as HTMLSelectElement;
    const nuevoEstado = select.value;

    const orden = this.misOrdenes().find(o => o.id === ordenId);
    if (!orden) return;

    const diagnostico = (orden as any).diagnostico || (orden as any).diagnosticoTecnico || '';
    const piezas = orden.piezasUtilizadas || '';

    this.serviceOrderService.registrarDiagnostico(
      ordenId,
      diagnostico,
      piezas,
      nuevoEstado
    ).subscribe({
      next: () => {
        orden.estado = nuevoEstado;
        alert(`¡Estado de la orden #${ordenId} actualizado a "${nuevoEstado}"!`);
      },
      error: (err) => {
        console.error('Error al cambiar el estado:', err);
        alert('No se pudo actualizar el estado de la orden.');
      }
    });
  }

  guardarDiagnostico(orden: ServiceOrder) {
    if (!orden) return;

    const diagnostico = (orden as any).diagnostico || (orden as any).diagnosticoTecnico || '';
    const piezas = orden.piezasUtilizadas || '';
    const estado = orden.estado || 'En Diagnostico';

    this.serviceOrderService.registrarDiagnostico(
      orden.id,
      diagnostico,
      piezas,
      estado
    ).subscribe({
      next: () => {
        alert(`¡Diagnóstico de la Orden #${orden.id} guardado correctamente!`);
        this.cargarMisOrdenes();
      },
      error: (err) => {
        console.error('Error al guardar el diagnóstico:', err);
        alert('Ocurrió un error al intentar guardar el diagnóstico.');
      }
    });
  }

  notificarPorWhatsApp(orden: ServiceOrder) {
    if (!orden) return;

    const ord = orden as any;
    this.notificandoMap.update(map => ({ ...map, [orden.id]: true }));

    const telefono = ord.telefonoCliente || ord.telefono || '4731234567';
    const nombreCliente = ord.nombreCliente || ord.cliente || 'Cliente';

    const mensaje = encodeURIComponent(
      `Hola ${nombreCliente}, te saludamos de EnTeck. Tu dispositivo ${orden.marca || ''} ${orden.modelo || ''} (Orden #${orden.id}) se encuentra en estado: *${orden.estado || 'En Proceso'}*.`
    );

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefono}&text=${mensaje}`;

    setTimeout(() => {
      window.open(urlWhatsApp, '_blank');
      this.notificandoMap.update(map => ({ ...map, [orden.id]: false }));
    }, 500);
  }
}