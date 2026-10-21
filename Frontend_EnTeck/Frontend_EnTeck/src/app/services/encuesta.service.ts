import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EncuestaDTO {
  idSolicitud: number;
  calificacion: number;
  comentarios: string;
}

@Injectable({
  providedIn: 'root'
})
export class EncuestaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5190/api/encuestas';

  registrarEncuesta(encuesta: EncuestaDTO): Observable<any> {
    return this.http.post(this.apiUrl, encuesta);
  }

  getPromedioYResumen(): Observable<any> {
    return this.http.get(`${this.apiUrl}/promedio`);
  }
}