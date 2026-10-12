import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // <-- Agregar esta importación

export interface ServiceOrder {
  id: number;
  marca: string;
  modelo: string;
  problema: string;
  estado: string;
  fechaRecibido: string;
  eta: string;
  idCliente: number;
  idTecnico?: number;
  nombreTecnico?: string;
  fechaAsignacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5190/api/solicitudes';

  getClientOrders(clientId: string | number): Observable<ServiceOrder[]> {
    // Consume la ruta que SÍ responde (/pendientes) y filtra las del cliente actual
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/pendientes`).pipe(
      map(ordenes => ordenes.filter(o => o.idCliente === Number(clientId)))
    );
  }

  getPendientes(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/pendientes`);
  }

  asignarTecnico(ordenId: number, idTecnico: number, nombreTecnico: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ordenId}/asignar`, {
      idTecnico,
      nombreTecnico
    });
  }

  getOrdenesPorTecnico(tecnicoId: number): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/tecnico/${tecnicoId}`);
  }

  actualizarEstado(ordenId: number, nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ordenId}/estado`, {
      nuevoEstado
    });
  }
}