import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://127.0.0.1:5190/api/solicitudes';

  getClientOrders(userId: string): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/client/${userId}`);
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

  // --- MÉTODOS PARA LA US-012 (PANTALLA DE TÉCNICOS) ---
  getOrdenesPorTecnico(tecnicoId: number): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/tecnico/${tecnicoId}`);
  }

  actualizarEstado(ordenId: number, nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ordenId}/estado`, {
      nuevoEstado
    });
  }
}