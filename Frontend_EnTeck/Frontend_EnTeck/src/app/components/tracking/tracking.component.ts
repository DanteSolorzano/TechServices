import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiceOrderService, ServiceOrder } from '../../services/service-order.service';

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
    // 1. Obtener parámetro 'folio' o 'id' de la URL nativa (ej. /tracking?folio=2 o /tracking?id=2)
    const urlParams = new URLSearchParams(window.location.search);
    const folioFromUrl = urlParams.get('folio') || urlParams.get('id');

    // 2. También verificar por parámetro de ActivatedRoute por si acaso
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
    if (!estado) return 'recibido';
    return estado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  getStatusText(estado: string): string {
    if (!estado) return 'Recibido';
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

  getProgress(estado: string): number {
    if (!estado) return 20;
    const norm = this.sanitizeClass(estado);
    const progressMap: { [key: string]: number } = {
      'recibido': 20,
      'en-proceso': 50,
      'esperando-refaccion': 65,
      'reparado': 90,
      'entregado': 100
    };
    return progressMap[norm] || 30;
  }
}