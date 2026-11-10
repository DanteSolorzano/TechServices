import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ClientsService } from '../../services/clients.service';
import { environment } from '../../../environments/environment'; 

@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-request.component.html',
  styleUrl: './service-request.component.css'
})
export class ServiceRequestComponent implements OnInit {
  sent = signal(false);
  loading = signal(false);
  error = signal('');
  clientName = signal('');

  data = { brand: '', model: '', issue: '' };

  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private clientsService = inject(ClientsService);

  ngOnInit(): void {
    this.loadClientData();
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
    const eta = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const payload = {
      idCliente: parseInt(userId),
      marca: this.data.brand,
      modelo: this.data.model,
      problema: this.data.issue,
      estado: 'Pending',
      eta: eta.toISOString()
    };

    // CAMBIO: Usando environment.apiUrl
    this.httpClient.post(`${environment.apiUrl}/api/service-order`, payload).subscribe({
      next: () => {
        this.sent.set(true);
        this.loading.set(false);
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