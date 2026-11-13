import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. Landing Page (Inicio)
  {
    path: '',
    loadComponent: () => import('./components/start-page/start-page.component').then(m => m.StartPageComponent)
  },
  // 2. Autenticación
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  // 3. Tracking Público
  {
    path: 'tracking',
    loadComponent: () => import('./components/tracking/tracking.component').then(m => m.TrackingComponent)
  },
  // 4. Panel Admin
  {
    path: 'admin',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  // 5. Panel Técnico
  {
    path: 'tecnico',
    loadComponent: () => import('./components/tecnico-dashboard/tecnico-dashboard.component').then(m => m.TecnicoDashboardComponent)
  },
  // 6. Solicitud de Servicio (Cliente)
  {
    path: 'solicitud',
    loadComponent: () => import('./components/service-request/service-request.component').then(m => m.ServiceRequestComponent)
  },
  // 7. Ruta comodín (404)
  {
    path: '**',
    redirectTo: '' // Redirige a la landing page si la ruta no existe
  }
];