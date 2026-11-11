import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ClientsService } from '../../services/clients.service';
import { ServiceOrderService } from '../../services/service-order.service';
import { ServiceOrder } from '../../models/service-order.model';
import { EncuestaComponent } from '../encuesta/encuesta.component'; // <-- IMPORTAMOS LA ENCUESTA
import { environment } from '../../../environments/environment'; 

@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [CommonModule, FormsModule, EncuestaComponent], // <-- AGREGAMOS A LOS IMPORTS
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request.component.html',
  styleUrl: './service-request.component.css'
})
export class ServiceRequestComponent implements OnInit {
  sent = signal(false);
  loading = signal(false);
  error = signal('');
  clientName = signal('');
  
  misSolicitudes = signal<ServiceOrder[]>([]);

  // NUEVA SEÑAL PARA CONTROLAR LA ENCUESTA ABIERTA
  encuestaAbiertaId = signal<number | null>(null);

  data = { brand: '', model: '', issue: '' };

  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private clientsService = inject(ClientsService);
  private serviceOrderService = inject(ServiceOrderService);

  ngOnInit(): void {
    this.loadClientData();
    this.cargarMisSolicitudes();
  }

  private loadClientData(): void {
    const userId = this.authService.getCookie('userId');
    if (!userId) {
      this.error.set('No user session found');
      return;
    }

    this.clientsService.getClient(userId).subscribe({
      next: (client) => {
        this.clientName.set(client.nombre);
      },
      error: (err) => {
        console.error('Failed to load client data:', err);
        this.error.set('Could not load your profile information');
      }
    });
  }

  cargarMisSolicitudes(): void {
    const userId = this.authService.getCookie('userId');
    if (!userId) return;

    this.serviceOrderService.getClientOrders(userId).subscribe({
      next: (orders) => {
        this.misSolicitudes.set(orders || []);
      },
      error: (err) => console.error('Error al cargar solicitudes:', err)
    });
  }

  getStatusClass(status: string): string {
    if (!status) return 'pendiente';
    return status
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  // NUEVAS FUNCIONES PARA LA ENCUESTA
  abrirEncuesta(idSolicitud: number) {
    this.encuestaAbiertaId.set(idSolicitud);
  }

  cerrarEncuesta() {
    this.encuestaAbiertaId.set(null);
  }

  onEncuestaEnviada() {
    this.cerrarEncuesta();
    this.cargarMisSolicitudes(); // Recarga la tabla para que traiga 'calificada: true'
  }

  isValid(): boolean {
    return !!this.data.brand && !!this.data.model && !!this.data.issue;
  }

  submit(): void {
    if (!this.isValid() || this.loading()) return;

    const userId = this.authService.getCookie('userId');
    if (!userId) {
      this.error.set('User session expired. Please login again.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const now = new Date();
    const eta = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const payload = {
      idCliente: parseInt(userId),
      marca: this.data.brand,
      modelo: this.data.model,
      problema: this.data.issue,
      estado: 'Pendiente',
      eta: eta.toISOString()
    };

    this.httpClient.post(`${environment.apiUrl}/api/service-order`, payload).subscribe({
      next: () => {
        this.sent.set(true);
        this.loading.set(false);
        this.cargarMisSolicitudes();
      },
      error: (err) => {
        console.error('Failed to submit service order:', err);
        this.error.set('Error sending request. Please try again.');
        this.loading.set(false);
      }
    });
  }

  reset(): void {
    this.data = { brand: '', model: '', issue: '' };
    this.sent.set(false);
    this.error.set('');
  }

  clearError(): void {
    this.error.set('');
  }
}