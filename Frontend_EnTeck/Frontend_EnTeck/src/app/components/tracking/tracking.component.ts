import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiceOrderService } from '../../services/service-order.service';
import { ServiceOrder } from '../../models/service-order.model';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.css'
})
export class TrackingComponent implements OnInit {
  searchId = '';
  order = signal<ServiceOrder | null>(null);
  loading = signal(false);
  error = signal('');
  searched = signal(false);

  private route = inject(ActivatedRoute);
  private serviceOrderService = inject(ServiceOrderService);

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const folioFromUrl = urlParams.get('folio') || urlParams.get('id');
    const paramId = folioFromUrl || this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('folio');

    if (paramId) {
      this.searchId = paramId;
      this.buscarOrden();
    }
  }

  buscarOrden(): void {
    const trimmedId = this.searchId.trim();
    if (!trimmedId) {
      this.error.set('Por favor ingresa un número de folio válido.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.order.set(null);
    this.searched.set(true);

    this.serviceOrderService.getPublicTracking(trimmedId).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al consultar la orden:', err);
        this.error.set('No se encontró ninguna orden con el folio proporcionado.');
        this.loading.set(false);
      }
    });
  }

  sanitizeClass(estado: string): string {
    if (!estado) return 'pendiente';
    return estado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  getStatusText(estado: string): string {
    if (!estado) return 'Pendiente';
    return estado;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === 'Por confirmar') return 'Por confirmar';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    } catch {
      return dateStr;
    }
  }

  // ACTUALIZADO: Mapa de progreso según los nuevos estados
  getProgress(estado: string): number {
    if (!estado) return 20;
    const norm = this.sanitizeClass(estado);
    const progressMap: { [key: string]: number } = {
      'pendiente': 20,
      'en-diagnostico': 40,
      'en-reparacion': 70,
      'listo': 100
    };
    return progressMap[norm] || 20;
  }
}