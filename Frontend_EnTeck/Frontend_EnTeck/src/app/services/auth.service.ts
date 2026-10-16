import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupRequest {
  Nombre: string;
  Telefono: string;
  Correo: string;
  Contrasena: string;
  Direccion?: string;
}

export interface LoginRequest {
  Correo: string;
  Contrasena: string;
}

export interface AuthResponse {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string;
  esAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:5190/api/auth';

  currentUser = signal<AuthResponse | null>(null);
  isLoggedIn = signal<boolean>(false);

  signup(data: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  logout(): void {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    this.deleteCookie('userId');
  }

  setCurrentUser(user: AuthResponse): void {
    if (user) {
      this.currentUser.set(user);
      this.isLoggedIn.set(true);
      
      const serializedUser = JSON.stringify(user);
      localStorage.setItem('currentUser', serializedUser);
      localStorage.setItem('user', serializedUser);

      if (user.id) {
        this.setCookie('userId', String(user.id), 7);
      }
    }
  }

  loadStoredUser(): void {
    const stored = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (stored) {
      try {
        const user: AuthResponse = JSON.parse(stored);
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      } catch (e) {
        console.error('Error al cargar la sesión guardada:', e);
        this.logout();
      }
    }
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUser();
  }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  private setCookie(name: string, value: string, days: number = 7): void {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}