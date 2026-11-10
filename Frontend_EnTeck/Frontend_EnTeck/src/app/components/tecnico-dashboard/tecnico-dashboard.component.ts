import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceOrderService } from '../../services/service-order.service';
import { ServiceOrder } from '../../models/service-order.model'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tecnico-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-dashboard.component.html',
  styleUrl: './tecnico-dashboard.component.css'
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