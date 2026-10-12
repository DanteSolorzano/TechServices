import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ServiceOrderService, ServiceOrder } from '../../services/service-order.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tracking-container">
      <div class="tracking-content">
        <h2>📋 Mis Órdenes de Servicio</h2>
        <p class="subtitle">Consulta el estado y tiempo estimado de entrega de tus equipos en reparación.</p>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading">
            <span class="spinner"></span> Cargando órdenes...
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="error-msg">
            ❌ Error al cargar las órdenes. Por favor intenta más tarde.
          </div>
        }

        <!-- Orders List -->
        @if (!loading() && orders().length > 0) {
          <div class="orders-list">
            @for (order of orders(); track order.id) {
              <div class="order-card" [ngClass]="'status-' + sanitizeClass(order.estado)">
                <div class="order-header">
                  <div class="order-info">
                    <h3>{{ order.marca || 'Equipo' }} {{ order.modelo || '' }}</h3>
                    <p class="problem">{{ order.problema }}</p>
                  </div>
                  <div class="order-id">Orden #{{ order.id }}</div>
                </div>

                <div class="order-details">
                  <div class="detail-row">
                    <span class="label">Estado Actual:</span>
                    <span class="status-badge" [ngClass]="'badge-' + sanitizeClass(order.estado)">
                      {{ getStatusText(order.estado) }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Fecha de Recepción:</span>
                    <span>{{ formatDate(order.fechaRecibido) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Fecha Estimada (ETA):</span>
                    <span class="eta-highlight">{{ formatDate(order.eta) }}</span>
                  </div>
                  @if (order.nombreTecnico) {
                    <div class="detail-row">
                      <span class="label">Técnico Asignado:</span>
                      <span>{{ order.nombreTecnico }}</span>
                    </div>
                  }
                </div>

                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width]="getProgress(order.estado) + '%'"></div>
                  </div>
                  <span class="progress-text">{{ getProgress(order.estado) }}% Completado</span>
                </div>
              </div>
            }
          </div>
        } @else if (!loading() && orders().length === 0) {
          <div class="no-orders">
            <span style="font-size: 40px;">📭</span>
            <p>No tienes órdenes de servicio registradas en este momento.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tracking-container { padding: 40px 20px; background: #f4f7f6; min-height: 100vh; }
    .tracking-content { max-width: 900px; margin: 0 auto; }
    
    h2 { margin: 0 0 10px 0; color: #333; }
    .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }

    /* Loading & Error */
    .loading { text-align: center; padding: 40px; background: white; border-radius: 12px; color: #007bff; font-weight: bold; }
    .spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px; vertical-align: middle; }
    .error-msg { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; text-align: center; font-weight: bold; }

    /* Cards */
    .orders-list { display: grid; gap: 20px; }
    .order-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #007bff; transition: transform 0.2s, box-shadow 0.2s; }
    .order-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }

    /* Variaciones de border e identificadores */
    .order-card.status-recibido { border-left-color: #6c757d; }
    .order-card.status-en-proceso { border-left-color: #007bff; }
    .order-card.status-esperando-refaccion { border-left-color: #ff9800; }
    .order-card.status-reparado { border-left-color: #28a745; }
    .order-card.status-entregado { border-left-color: #17a2b8; }

    .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
    .order-info h3 { margin: 0; color: #333; font-size: 18px; }
    .order-info .problem { margin: 5px 0 0 0; color: #666; font-size: 14px; }
    .order-id { background: #eef2f5; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #333; }

    .order-details { margin-bottom: 15px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px stroke #f9f9f9; }
    .detail-row .label { font-weight: 600; color: #555; }
    .detail-row span { color: #333; }
    .eta-highlight { font-weight: bold; color: #007bff !important; }

    /* Badges */
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
    .badge-recibido { background: #e9ecef; color: #495057; }
    .badge-en-proceso { background: #e3f2fd; color: #0d47a1; }
    .badge-esperando-refaccion { background: #fff3e0; color: #e65100; }
    .badge-reparado { background: #e8f5e9; color: #1b5e20; }
    .badge-entregado { background: #e0f7fa; color: #006064; }

    /* Progress */
    .progress-container { margin-top: 15px; }
    .progress-bar { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
    .progress-fill { height: 100%; background: #007bff; transition: width 0.5s ease; }
    .progress-text { font-size: 11px; color: #888; display: block; text-align: right; }

    .no-orders { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; color: #999; }
    .no-orders p { margin: 20px 0 0 0; font-size: 16px; }

    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class TrackingComponent implements OnInit {
  orders = signal<ServiceOrder[]>([]);
  loading = signal(false);
  error = signal('');

  private authService = inject(AuthService);
  private serviceOrderService = inject(ServiceOrderService);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    const userId = this.authService.getCookie('userId');
    if (!userId) {
      this.error.set('No se encontró una sesión activa de usuario.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.serviceOrderService.getClientOrders(userId).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar órdenes de cliente:', err);
        this.error.set('Error al cargar la lista de órdenes. Inténtalo de nuevo.');
        this.loading.set(false);
      }
    });
  }

  // Normaliza el nombre del estado para su uso seguro en clases CSS
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