import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceOrderService, ServiceOrder } from '../../services/service-order.service';

@Component({
  selector: 'app-tecnico-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-dashboard.component.html',
  styles: [`
    .tech-panel { padding: 2rem; background: #f8f9fa; min-height: 80vh; }
    .tech-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; color: #1a1a1a; }

    .grid-orders { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
    .card-order { background: white; border-radius: 10px; border: 1px solid #e0e0e0; padding: 1.25rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .folio-badge { background: #e3f2fd; color: #1976d2; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }

    .device-name { font-weight: bold; font-size: 1.1rem; color: #333; margin-bottom: 0.5rem; }
    .problem-desc { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }

    .status-select { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.9rem; background: #fff; }
    
    .form-label-custom { font-size: 0.85rem; font-weight: bold; color: #444; display: block; margin-top: 0.75rem; margin-bottom: 4px; }
    .text-area-custom { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.85rem; resize: vertical; box-sizing: border-box; }
    .btn-save { width: 100%; margin-top: 0.75rem; padding: 8px; background-color: #28a745; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-save:hover { background-color: #218838; }
  `]
})
export class TecnicoDashboardComponent implements OnInit {
  private serviceOrderService = inject(ServiceOrderService);

  tecnicoId = signal<number>(2);
  misOrdenes = signal<ServiceOrder[]>([]);

  ngOnInit(): void {
    this.cargarMisOrdenes();
  }

  cargarMisOrdenes(): void {
    this.serviceOrderService.getOrdenesPorTecnico(this.tecnicoId()).subscribe({
      next: (data: ServiceOrder[]) => this.misOrdenes.set(data),
      error: (err: any) => console.error('Error al cargar órdenes del técnico:', err)
    });
  }

  cambiarEstado(ordenId: number, event: Event): void {
    const selectElem = event.target as HTMLSelectElement;
    const nuevoEstado = selectElem.value;

    this.serviceOrderService.actualizarEstado(ordenId, nuevoEstado).subscribe({
      next: () => {
        alert(`¡Estado de la orden #${ordenId} actualizado a "${nuevoEstado}"!`);
        this.cargarMisOrdenes();
      },
      error: (err: any) => console.error('Error al actualizar el estado:', err)
    });
  }

  guardarDiagnostico(orden: ServiceOrder): void {
    if (!orden.diagnostico?.trim() || !orden.piezasUtilizadas?.trim()) {
      alert('Por favor, ingresa tanto el diagnóstico como las piezas utilizadas.');
      return;
    }

    this.serviceOrderService.registrarDiagnostico(
      orden.id,
      orden.diagnostico,
      orden.piezasUtilizadas,
      orden.estado
    ).subscribe({
      next: () => {
        alert(`¡Diagnóstico y piezas guardados correctamente para la orden #${orden.id}!`);
        this.cargarMisOrdenes();
      },
      error: (err: any) => console.error('Error al guardar el diagnóstico:', err)
    });
  }
}