import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id?: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string;
  esAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5190/api/clientes';

  // Estado del cliente actual para sesión
  private currentClientSignal = signal<Client | null>(null);
  readonly currentClient = this.currentClientSignal.asReadonly();

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClient(id: number | string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  getClientById(id: number): Observable<Client> {
    return this.getClient(id);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  setCurrentClient(client: Client | null): void {
    this.currentClientSignal.set(client);
  }

  logout(): void {
    this.currentClientSignal.set(null);
  }
}