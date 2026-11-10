import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // <-- NUEVO


export interface WhatsAppNotificationPayload {
  cliente: string;
  telefono: string;
  ordenId: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
private apiUrl = `${environment.apiUrl}/api/WhatsApp/enviar`; // <-- CAMBIO

  constructor(private http: HttpClient) {}

  enviarNotificacion(data: WhatsAppNotificationPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}