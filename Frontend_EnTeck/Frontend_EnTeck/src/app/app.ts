import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
  private router = inject(Router);

  currentView = signal<string>('tracking');
  currentClient = signal<AuthResponse | null>(null);

  ngOnInit() {
    // Sincronizar con la URL inicial
    this.evaluarYcargarSesion();

    // Escuchar cada cambio de URL y sincronizar currentView
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const path = event.urlAfterRedirects.replace('/', '').split('?')[0] || 'tracking';
        this.currentView.set(path);
      });
  }

  evaluarYcargarSesion() {
  const path = window.location.pathname.toLowerCase();

  this.authService.loadStoredUser();
  const user = this.authService.getCurrentUser();

  if (!user) {
    this.currentClient.set(null);
    const targetView = path.includes('auth') ? 'auth' : 'tracking';
    this.currentView.set(targetView);
    return;
  }

  this.currentClient.set(user);

  const esAdmin = user.esAdmin === true || Number(user.esAdmin) === 1;

  let targetView = 'home';
  if (esAdmin) {
    targetView = 'admin';
  } else if (this.isTecnico(user)) {
    targetView = 'tecnico';
  }

  this.currentView.set(targetView);

  // Actualizar la URL sin agregar entrada al historial
  window.history.replaceState({}, '', `/${targetView}`);
}

  private isTecnico(user: AuthResponse): boolean {
    if (!user) return false;

    const esAdmin = user.esAdmin === true || Number(user.esAdmin) === 1;
    if (esAdmin) return false;

      // 2. Primero: rol del backend ("admin", "tecnico", "cliente")
    const rol = ((user as any).rol || '').toString().toLowerCase().trim();
    if (rol === 'tecnico' || rol === 'técnico') return true;

    // 3. Fallback: nivelPrivilegio === 1 (según acuerdo del equipo)
    const nivel = Number((user as any).nivelPrivilegio);
    if (nivel === 1) return true;

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