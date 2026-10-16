import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './components/auth/auth.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { ServiceRequestComponent } from './components/service-request/service-request.component';
import { TecnicoDashboardComponent } from './components/tecnico-dashboard/tecnico-dashboard.component';
import { AuthService, AuthResponse } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AuthComponent,
    AdminDashboardComponent,
    TrackingComponent,
    ServiceRequestComponent,
    TecnicoDashboardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'Frontend_EnTeck';

  private authService = inject(AuthService);

  currentView = signal<string>('tracking');
  currentClient = signal<AuthResponse | null>(null);

  ngOnInit() {
    this.evaluarYcargarSesion();
  }

  evaluarYcargarSesion() {
    const path = window.location.pathname.toLowerCase();
    
    // Cargar sesión mediante el servicio centralizado
    this.authService.loadStoredUser();
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.currentClient.set(null);
      if (path.includes('auth')) {
        this.currentView.set('auth');
      } else {
        this.currentView.set('tracking');
      }
      return;
    }

    this.currentClient.set(user);

    // EVALUACIÓN DE ROLES BASADA EXCLUSIVAMENTE EN EL CONTRATO DE BD
    const esAdmin = user.esAdmin === true || Number(user.esAdmin) === 1;

    if (esAdmin) {
      this.currentView.set('admin');
    } else if (this.isTecnico(user)) {
      this.currentView.set('tecnico');
    } else {
      this.currentView.set('home');
    }
  }

  private isTecnico(user: AuthResponse): boolean {
    if (!user) return false;

    const esAdmin = user.esAdmin === true || Number(user.esAdmin) === 1;
    if (esAdmin) return false;

    const correo = (user.correo || '').toLowerCase().trim();
    return correo.includes('tecnico');
  }

  setView(view: string) {
    this.currentView.set(view);
    window.history.pushState({}, '', `/${view}`);
  }

  isViewActive(view: string): boolean {
    return this.currentView() === view;
  }

  onLoginSuccess() {
    this.evaluarYcargarSesion();
  }

  logout() {
    this.authService.logout();
    this.currentClient.set(null);
    this.setView('tracking');
  }
}