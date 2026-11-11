import { Component, Input, inject, signal, output } from '@angular/core'; // <-- Importar 'output'
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
  
  // NUEVO: Evento para avisar al padre
  encuestaEnviada = output<void>();

  calificacionSeleccionada: number = 0;
  comentarios: string = '';
  enviado: boolean = false;
  enviando = signal<boolean>(false);

  seleccionarEstrella(estrellas: number) {
    this.calificacionSeleccionada = estrellas;
  }

  enviarEvaluacion() {
    if (this.calificacionSeleccionada === 0 || this.enviando()) return;

    this.enviando.set(true);

    const dto = {
      idSolicitud: this.idSolicitud,
      calificacion: this.calificacionSeleccionada,
      comentarios: this.comentarios
    };

    this.encuestaService.registrarEncuesta(dto).subscribe({
      next: () => {
        this.enviado = true;
        this.enviando.set(false);
        this.encuestaEnviada.emit(); // <-- AVISAMOS AL PADRE
      },
      error: (err) => {
        console.error('Error al guardar la encuesta', err);
        this.enviando.set(false);
      }
    });
  }
}