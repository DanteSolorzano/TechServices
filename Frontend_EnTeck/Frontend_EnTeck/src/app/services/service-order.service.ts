import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ServiceOrder {
  id: number;
  marca: string;
  modelo: string;
  problema: string;
  estado: string;
  fechaRecibido: string;
  eta?: string;
  idCliente: number;
  telefonoCliente?: string;
  telefono?: string;
  idTecnico?: number;
  nombreTecnico?: string;
  fechaAsignacion?: string;
  diagnostico?: string;
  piezasUtilizadas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5190/api/solicitudes';

  getClientOrders(clientId: string | number): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/cliente/${clientId}`).pipe(
      catchError(() => {
        return this.getPendientes().pipe(
          map(ordenes => ordenes.filter(o => o.idCliente === Number(clientId)))
        );
      })
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
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/tecnico/${tecnicoId}`).pipe(
      map(ordenes => {
        // Si el endpoint devuelve datos, los entrega directamente
        if (ordenes && ordenes.length > 0) {
          return ordenes;
        }
        throw new Error('Sin ordenes directas');
      }),
      catchError(() => {
        // Si el endpoint de técnico falla o viene vacío, recupera todas las pendientes de la BD
        return this.getPendientes().pipe(
          map(ordenes => {
            if (!ordenes) return [];
            // Devuelve las órdenes que corresponden al técnico o que aún están pendientes de asignación
            const filtradas = ordenes.filter(o => 
              o.idTecnico === tecnicoId || 
              !o.idTecnico || 
              o.idTecnico === 0 ||
              o.estado === 'En Proceso' ||
              o.estado === 'Recibido' ||
              o.estado === 'Pendiente'
            );
            return filtradas.length > 0 ? filtradas : ordenes;
          })
        );
      })
    );
  }

  actualizarEstado(ordenId: number, nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ordenId}/estado`, {
      nuevoEstado
    });
  }

  registrarDiagnostico(
    ordenId: number, 
    diagnostico: string, 
    piezasUtilizadas: string, 
    estado?: string
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ordenId}/diagnostico`, {
      diagnostico,
      piezasUtilizadas,
      estado
    });
  }

  getPublicTracking(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/public/tracking/${id}`);
  }
}