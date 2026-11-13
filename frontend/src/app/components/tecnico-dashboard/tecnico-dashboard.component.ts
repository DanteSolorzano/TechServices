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

  currentUserName = signal<string>('Técnico');
  misOrdenes = signal<ServiceOrder[]>([]);
  cargando = signal<boolean>(true);

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.nombre) {
      this.currentUserName.set(user.nombre);
    }
    this.cargarMisOrdenes();
  }

  cargarMisOrdenes() {
    this.cargando.set(true);
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.id) {
      this.cargando.set(false);
      return;
    }

    this.serviceOrderService.getOrdenesPorTecnico(user.id).subscribe({
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
      (orden as any).diagnostico || '',
      orden.piezasUtilizadas || '',
      nuevoEstado
    ).subscribe({
      next: () => {
        orden.estado = nuevoEstado;
        if (nuevoEstado === 'Listo') {
          this.cargarMisOrdenes();
        }
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
      (orden as any).diagnostico || '',
      orden.piezasUtilizadas || '',
      orden.estado || 'En Diagnostico'
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
}