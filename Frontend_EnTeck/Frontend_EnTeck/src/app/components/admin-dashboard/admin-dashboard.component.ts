import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuItem } from '../../models/menu-item.model';
import { User } from '../../models/user.model';
import { ServiceOrder, ReporteRendimiento } from '../../models/service-order.model';
import { ServiceOrderService } from '../../services/service-order.service';
import { AuthService } from '../../services/auth.service'; // <-- NUEVO
import { environment } from '../../../environments/environment';

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
  private authService = inject(AuthService); // <-- NUEVO

  // NUEVA SEÑAL PARA EL NOMBRE DEL USUARIO
  currentUserName = signal<string>('Administrador');

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
    nivelPrivilegio: 2
  };

  isEditingUser = signal(false);
  editUserData = signal<User | null>(null);

  isEditing = signal(false);
  currentItem = signal<MenuItem>(this.getEmptyItem());

  items = signal<MenuItem[]>([
    { id: 1, nombre: 'Cambio de Pantalla iPhone 11', categoria: 'Servicios', descripcion: 'Display OLED.', modeloCompatible: 'iPhone 11', precio: 1200, stock: 100, imagenUrl: '', esServicio: true },
    { id: 4, nombre: 'Funda Survivor', categoria: 'Fundas', descripcion: 'Uso rudo.', modeloCompatible: 'Samsung A54', precio: 250, stock: 5, imagenUrl: '', esServicio: false }
  ]);

  ngOnInit() {
    // OBTENER EL NOMBRE DEL USUARIO LOGUEADO
    const user = this.authService.getCurrentUser();
    if (user && user.nombre) {
      this.currentUserName.set(user.nombre);
    }

    this.cargarUsuarios();
    this.cargarOrdenesPendientes();
    this.cargarReportes();
  }

  cargarUsuarios() {
    this.httpClient.get<User[]>(`${environment.apiUrl}/api/clientes`).subscribe({
      next: (users) => {
        if (users) {
          this.usuarios.set(users);
          
          const soloTecnicos = users.filter(u => {
            return !u.esAdmin && u.nivelPrivilegio === 1; // 1 = Técnico
          }).map(u => ({ id: u.id, nombre: u.nombre }));

          this.tecnicos.set(soloTecnicos);
        }
      },
      error: (err) => console.error('Error al cargar clientes/técnicos:', err)
    });
  }

  obtenerEtiquetaRol(user: User): { texto: string; clase: string } {
    const nivel = Number(user.nivelPrivilegio);
    if (nivel === 0 || user.esAdmin) return { texto: '🛡️ Administrador', clase: 'in-stock' };
    if (nivel === 1) return { texto: '🛠️ Técnico', clase: 'tech-stock' };
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

    this.httpClient.post(`${environment.apiUrl}/api/clientes`, this.nuevoUsuario).subscribe({
      next: () => {
        alert(`¡Usuario "${this.nuevoUsuario.nombre}" creado exitosamente!`);
        this.nuevoUsuario = { nombre: '', correo: '', contrasena: '', telefono: '', direccion: '', nivelPrivilegio: 2 };
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al registrar usuario:', err);
        alert('Hubo un problema al crear el usuario.');
      }
    });
  }

  startEditUser(user: User) {
    this.editUserData.set({ ...user });
    this.isEditingUser.set(true);
  }

  cancelEditUser() {
    this.isEditingUser.set(false);
    this.editUserData.set(null);
  }

  actualizarUsuario() {
    const userToUpdate = this.editUserData();
    if (!userToUpdate || !userToUpdate.id) return;

    this.httpClient.put(`${environment.apiUrl}/api/clientes/${userToUpdate.id}`, userToUpdate).subscribe({
      next: () => {
        alert('¡Usuario actualizado exitosamente!');
        this.cancelEditUser();
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
        alert('Hubo un problema al actualizar el usuario.');
      }
    });
  }

  eliminarUsuario(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      this.httpClient.delete(`${environment.apiUrl}/api/clientes/${id}`).subscribe({
        next: () => {
          alert('Usuario eliminado correctamente.');
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          alert('Hubo un problema al eliminar el usuario.');
        }
      });
    }
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