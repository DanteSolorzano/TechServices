import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

export interface RendimientoTecnico {
  tecnicoId: number;
  nombreTecnico: string;
  ordenesAsignadas: number;
  ordenesFinalizadas: number;
  ordenesEnProceso: number;
}

export interface ReporteRendimiento {
  totalOrdenes: number;
  completadas: number;
  enProceso: number;
  pendientes: number;
  rendimientoTecnicos: RendimientoTecnico[];
}

@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/solicitudes`; 

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

  // NUEVO MÉTODO PARA FINALIZAR LA ORDEN
  finalizarOrden(ordenId: number): Observable<any> {
    // Reutilizamos el endpoint de asignar, pero solo enviamos el estado
    return this.http.put(`${this.apiUrl}/${ordenId}/asignar`, {
      estado: 'Listo'
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

  getReporteRendimiento(fechaInicio?: string, fechaFin?: string): Observable<ReporteRendimiento> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<ReporteRendimiento>(`${this.apiUrl}/reporte-rendimiento`, { params });
  }
}