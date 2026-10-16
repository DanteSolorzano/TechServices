import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:5190/api/WhatsApp/enviar';

  constructor(private http: HttpClient) {}

  enviarNotificacion(data: WhatsAppNotificationPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}