import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { AdminComponent } from './components/admin/admin.component';
import { TrackingComponent } from './components/tracking/tracking.component';

export const routes: Routes = [
  // Ruta por defecto: redirige al tracking o auth
  { path: '', redirectTo: 'tracking', pathMatch: 'full' },

  // Ruta pública para consultar el estado del servicio (US-015)
  { path: 'tracking', component: TrackingComponent },

  // Rutas de autenticación y administración
  { path: 'auth', component: AuthComponent },
  { path: 'admin', component: AdminComponent },

  // Regla Wildcard (comodín **): redirige cualquier ruta desconocida a tracking
  { path: '**', redirectTo: 'tracking' }
];