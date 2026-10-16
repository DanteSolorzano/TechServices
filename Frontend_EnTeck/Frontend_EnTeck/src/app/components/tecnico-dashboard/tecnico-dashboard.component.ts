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
    .tech-wrapper { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .tech-header-card { background: #1a1a1a; color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00e5ff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .order-card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .badge-recibido { background: #e2e8f0; color: #4a5568; }
    .badge-proceso { background: #feebc8; color: #c05621; }
    .badge-listo { background: #c6f6d5; color: #22543d; }
    .badge-entregado { background: #e2e8f0; color: #2d3748; }
    .grid-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 8px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group input, .form-group textarea, .form-group select { padding: 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 13px; }
    .btn-save { background: #3182ce; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  `]
})
export class TecnicoDashboardComponent implements OnInit {
  private serviceOrderService = inject(ServiceOrderService);
  private authService = inject(AuthService);

  misOrdenes = signal<ServiceOrder[]>([]);
  cargando = signal<boolean>(true);
  notificandoMap = signal<{ [key: number]: boolean }>({});

  estadosDisponibles: string[] = [
    'Recibido',
    'En Diagnóstico',
    'Esperando Repuesto',
    'En Reparación',
    'Listo para Entrega',
    'Entregado'
  ];

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

    this.serviceOrderService.registrarDiagnostico(
      ordenId,
      orden.diagnostico || '',
      orden.piezasUtilizadas || '',
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

    this.serviceOrderService.registrarDiagnostico(
      orden.id,
      orden.diagnostico || '',
      orden.piezasUtilizadas || '',
      orden.estado || 'En Diagnóstico'
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