import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncuestaService } from '../../services/encuesta.service';

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent {
  private encuestaService = inject(EncuestaService);

  @Input() idSolicitud: number = 0;
  
  calificacionSeleccionada: number = 0;
  comentarios: string = '';
  enviado: boolean = false;

  seleccionarEstrella(estrellas: number) {
    this.calificacionSeleccionada = estrellas;
  }

  enviarEvaluacion() {
    if (this.calificacionSeleccionada === 0) return;

    const dto = {
      idSolicitud: this.idSolicitud,
      calificacion: this.calificacionSeleccionada,
      comentarios: this.comentarios
    };

    this.encuestaService.registrarEncuesta(dto).subscribe({
      next: () => {
        this.enviado = true;
      },
      error: (err) => {
        console.error('Error al guardar la encuesta', err);
      }
    });
  }
}