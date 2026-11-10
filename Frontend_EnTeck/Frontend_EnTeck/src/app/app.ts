import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'; 
import { AuthService } from './services/auth.service';
import { AuthResponse } from './models/user.model'; // Asegúrate de tener este import

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'Frontend_EnTeck';

  public authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.loadStoredUser();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  esTecnico(user: AuthResponse | null): boolean {
    if (!user) return false;

    const esAdmin = user.esAdmin === true || Number(user.esAdmin) === 1;
    if (esAdmin) return false;

    const rol = (user.rol || '').toString().toLowerCase().trim();
    if (rol === 'tecnico' || rol === 'técnico') return true;

    const nivel = Number((user as any).nivelPrivilegio);
    if (nivel === 1) return true;

    const correo = (user.correo || '').toLowerCase().trim();
    return correo.includes('tecnico');
  }
}