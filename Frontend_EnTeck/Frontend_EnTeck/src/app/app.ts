import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './components/auth/auth.component';
import { AdminComponent } from './components/admin/admin.component';
import { TrackingComponent } from './components/tracking/tracking.component';
import { ServiceRequestComponent } from './components/service-request/service-request.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AuthComponent,
    AdminComponent,
    TrackingComponent,
    ServiceRequestComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'Frontend_EnTeck';

  // Forzamos el estado inicial en 'tracking'
  currentView = signal<string>('tracking');
  currentClient = signal<any>(null);

  ngOnInit() {
    const path = window.location.pathname.toLowerCase();
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentClient.set(user);
      } catch (e) {
        console.error('Error al cargar sesión', e);
      }
    }

    // Regla estricta de Vistas
    if (path.includes('admin') && this.currentClient()?.esAdmin) {
      this.currentView.set('admin');
    } else if (path.includes('auth')) {
      this.currentView.set('auth');
    } else {
      // Prioridad pública: US-015 Tracking
      this.currentView.set('tracking');
    }
  }

  setView(view: string) {
    this.currentView.set(view);
    window.history.pushState({}, '', `/${view}`);
  }

  isViewActive(view: string): boolean {
    return this.currentView() === view;
  }

  onLoginSuccess() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.currentClient.set(user);

      if (user.esAdmin || user.esAdmin === 1) {
        this.setView('admin');
      } else {
        this.setView('home');
      }
    } else {
      this.setView('admin');
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentClient.set(null);
    this.setView('tracking');
  }
}