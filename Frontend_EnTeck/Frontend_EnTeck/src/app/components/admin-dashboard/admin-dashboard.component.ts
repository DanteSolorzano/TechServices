import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuItem } from '../../models/menu-item.model';
import { ServiceOrderService, ServiceOrder, ReporteRendimiento } from '../../services/service-order.service';

interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  esAdmin: boolean;
  rol?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private serviceOrderService = inject(ServiceOrderService);
  private httpClient = inject(HttpClient);

  activeTab = signal<'inventario' | 'reparto' | 'usuarios' | 'reportes'>('inventario');
  ordenesPendientes = signal<ServiceOrder[]>([]);
  usuarios = signal<User[]>([]);
  tecnicos = signal<{ id: number; nombre: string }[]>([]);

  reporteRendimiento = signal<ReporteRendimiento | null>(null);
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');

  nuevoUsuario = {
    nombre: '',
    correo: '',
    contrasena: '',
    telefono: '',
    direccion: '',
    rolSeleccionado: 'cliente'
  };

  isEditing = signal(false);
  currentItem = signal<MenuItem>(this.getEmptyItem());

  items = signal<MenuItem[]>([
    { id: 1, nombre: 'Cambio de Pantalla iPhone 11', categoria: 'Servicios', descripcion: 'Display OLED.', modeloCompatible: 'iPhone 11', precio: 1200, stock: 100, imagenUrl: '', esServicio: true },
    { id: 4, nombre: 'Funda Survivor', categoria: 'Fundas', descripcion: 'Uso rudo.', modeloCompatible: 'Samsung A54', precio: 250, stock: 5, imagenUrl: '', esServicio: false }
  ]);

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarOrdenesPendientes();
    this.cargarReportes();
  }

  cargarUsuarios() {
    this.httpClient.get<User[]>('http://localhost:5190/api/clientes').subscribe({
      next: (users) => {
        if (users) {
          this.usuarios.set(users);
          
          // FILTRO ESTRICTO: Solo incluir usuarios registrados con rol 'tecnico' o correo técnico
          const soloTecnicos = users.filter(u => {
            const correo = (u.correo || '').toLowerCase().trim();
            const rol = (u.rol || '').toLowerCase().trim();
            return !u.esAdmin && (rol === 'tecnico' || correo.includes('tecnico'));
          }).map(u => ({ id: u.id, nombre: u.nombre }));

          this.tecnicos.set(soloTecnicos);
        }
      },
      error: (err) => console.error('Error al cargar clientes/técnicos:', err)
    });
  }

  obtenerEtiquetaRol(user: User): { texto: string; clase: string } {
    if (user.esAdmin || user.rol === 'admin') {
      return { texto: '🛡️ Administrador', clase: 'in-stock' };
    }
    
    const correo = (user.correo || '').toLowerCase().trim();
    const rol = (user.rol || '').toLowerCase().trim();
    if (rol === 'tecnico' || correo.includes('tecnico')) {
      return { texto: '🛠️ Técnico', clase: 'tech-stock' };
    }

    return { texto: '👤 Cliente', clase: 'low-stock' };
  }

  cargarReportes() {
    this.serviceOrderService.getReporteRendimiento(
      this.filtroFechaInicio(),
      this.filtroFechaFin()
    ).subscribe({
      next: (data) => this.reporteRendimiento.set(data),
      error: (err) => console.error('Error al cargar reporte de rendimiento:', err)
    });
  }

  limpiarFiltrosFechas() {
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.cargarReportes();
  }

  registrarUsuario() {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.correo) {
      alert('Por favor, ingresa al menos el Nombre y el Correo.');
      return;
    }

    const payload = {
      nombre: this.nuevoUsuario.nombre,
      correo: this.nuevoUsuario.correo,
      contrasena: this.nuevoUsuario.contrasena,
      telefono: this.nuevoUsuario.telefono,
      direccion: this.nuevoUsuario.direccion,
      esAdmin: this.nuevoUsuario.rolSeleccionado === 'admin',
      rol: this.nuevoUsuario.rolSeleccionado
    };

    // Intentamos en /api/clientes
    this.httpClient.post('http://localhost:5190/api/clientes', payload).subscribe({
      next: () => {
        alert(`¡Usuario "${this.nuevoUsuario.nombre}" creado exitosamente!`);
        this.nuevoUsuario = {
          nombre: '',
          correo: '',
          contrasena: '',
          telefono: '',
          direccion: '',
          rolSeleccionado: 'cliente'
        };
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error en /api/clientes, probando /api/auth/register...', err);
        
        // Fallback en caso de que el backend gestione registros por /api/auth/register
        this.httpClient.post('http://localhost:5190/api/auth/register', payload).subscribe({
          next: () => {
            alert(`¡Usuario "${this.nuevoUsuario.nombre}" registrado exitosamente!`);
            this.nuevoUsuario = {
              nombre: '',
              correo: '',
              contrasena: '',
              telefono: '',
              direccion: '',
              rolSeleccionado: 'cliente'
            };
            this.cargarUsuarios();
          },
          error: (err2) => {
            console.error('Error al registrar usuario:', err2);
            alert('Hubo un problema al crear el usuario. Revisa el backend en C#.');
          }
        });
      }
    });
  }

  cargarOrdenesPendientes() {
    this.serviceOrderService.getPendientes().subscribe({
      next: (data) => this.ordenesPendientes.set(data),
      error: (err) => console.error('Error al cargar órdenes:', err)
    });
  }

  asignarTecnico(ordenId: number, event: Event) {
    const selectElem = event.target as HTMLSelectElement;
    const tecnicoId = Number(selectElem.value);
    const tecnico = this.tecnicos().find(t => t.id === tecnicoId);

    if (!tecnico) return;

    this.serviceOrderService.asignarTecnico(ordenId, tecnico.id, tecnico.nombre).subscribe({
      next: () => {
        alert(`¡Orden #${ordenId} asignada exitosamente a ${tecnico.nombre}!`);
        this.cargarOrdenesPendientes();
        this.cargarReportes();
      },
      error: (err) => console.error('Error al asignar técnico:', err)
    });
  }

  getEmptyItem(): MenuItem {
    return {
      id: 0,
      nombre: '',
      categoria: 'Fundas',
      descripcion: '',
      modeloCompatible: '',
      precio: 0,
      stock: 0,
      imagenUrl: '',
      esServicio: false
    };
  }

  startEdit(item: MenuItem) {
    this.currentItem.set({ ...item });
    this.isEditing.set(true);
  }

  startAdd() {
    this.currentItem.set(this.getEmptyItem());
    this.isEditing.set(true);
  }

  saveItem() {
    const itemToSave = this.currentItem();
    this.items.update(currentItems => {
      if (itemToSave.id === 0) {
        return [...currentItems, { ...itemToSave, id: Date.now() }];
      } else {
        return currentItems.map(i => i.id === itemToSave.id ? itemToSave : i);
      }
    });
    this.cancelEdit();
  }

  deleteItem(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.items.update(current => current.filter(i => i.id !== id));
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.currentItem.set(this.getEmptyItem());
  }
}