import { Component, signal, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Componentes
import { TrackingComponent } from './components/tracking/tracking.component';
import { ServiceRequestComponent } from './components/service-request/service-request.component';
import { AuthComponent } from './components/auth/auth.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

// Servicios
import { AuthService } from './services/auth.service';
import { ClientsService } from './services/clients.service';

// Definimos las vistas posibles
type ViewMode = 'auth' | 'home' | 'tracking' | 'service-order' | 'admin';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TrackingComponent,
    ServiceRequestComponent,
    AuthComponent,
    AdminComponent,
    AdminDashboardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private clientsService = inject(ClientsService);
  
  // --- ESTADO DE NAVEGACIÓN ---
  currentView = signal<ViewMode>('auth'); 
  
  // Client data for greeting
  protected readonly currentClient = this.clientsService.currentClient;
  protected readonly isAdmin = signal(false);

  ngOnInit() {
    this.authService.loadStoredUser();

    const userId = this.authService.getCookie('userId');

    if (userId) {
      this.clientsService.getClient(userId).subscribe({
        next: (client) => {
          console.log('CLIENTE COMPLETO:', client);
          this.clientsService.setCurrentClient(client);

          if (client.esAdmin) {
            this.isAdmin.set(true);
            this.setView('admin');
          } else {
            this.isAdmin.set(false);
            this.setView('home');
          }
        },
        error: (error) => {
          console.error('Error loading client data:', error);
        }
      });
    }
  }

  // --- FUNCIÓN DE NAVEGACIÓN ---
  setView(view: ViewMode) {
    this.currentView.set(view);
    window.scrollTo(0, 0);
  }

  onLoginSuccess(): void {
    window.location.reload();
  }

  goHome() {
    this.setView('home');
  }

  isViewActive(view: string): boolean {
    return this.currentView() === view;
  }

  logout() {
    this.authService.logout();
    this.clientsService.logout();
    this.isAdmin.set(false);
    this.setView('auth');
  }
}