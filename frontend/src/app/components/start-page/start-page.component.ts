import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EncuestaService } from '../../services/encuesta.service';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './start-page.component.html',
  styleUrl: './start-page.component.css'
})
export class StartPageComponent implements OnInit {
  private encuestaService = inject(EncuestaService);

  // Señales para guardar los datos
  promedio = signal<number>(0);
  totalRespuestas = signal<number>(0);
  resenas = signal<any[]>([]);

  ngOnInit(): void {
    this.cargarResenas();
  }

  cargarResenas() {
    this.encuestaService.getPromedioYResumen().subscribe({
      next: (data) => {
        this.promedio.set(data.promedio);
        this.totalRespuestas.set(data.totalRespuestas);
        this.resenas.set(data.encuestas);
      },
      error: (err) => console.error('Error al cargar reseñas:', err)
    });
  }

  // Helper para generar el arreglo de estrellas según la calificación
  getEstrellas(calificacion: number): number[] {
    return Array(calificacion).fill(0);
  }
}