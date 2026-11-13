import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MenuItem } from '../../models/menu-item.model';
import { User } from '../../models/user.model';
import { ServiceOrder, ReporteRendimiento } from '../../models/service-order.model';
import { ServiceOrderService } from '../../services/service-order.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { WhatsappService } from '../../services/whatsapp.service'; // <-- NUEVO


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
  private authService = inject(AuthService);
    private whatsappService = inject(WhatsappService); 


  currentUserName = signal<string>('Administrador');

  activeTab = signal<'inventario' | 'reparto' | 'usuarios' | 'reportes'>('reparto');
  
  todasLasOrdenes = signal<ServiceOrder[]>([]); 

  enviarWhatsApp(orden: ServiceOrder, tipo: 'cambio_estado' | 'encuesta') {
    if (!orden) return;

    // 1. Buscamos al cliente en la lista de usuarios que ya cargamos
    const cliente = this.usuarios().find(u => u.id === orden.idCliente);
    
    // 2. Extraemos los datos reales. Si por alguna razón no se encuentra, usamos un valor por defecto
    const telefono = cliente?.telefono || '4737563898'; 
    const nombreCliente = cliente?.nombre || 'Cliente';
    
    // 3. El dispositivo viene directo de la tabla SolicitudServicio (orden)
    const dispositivo = `${orden.marca} ${orden.modelo}`;

    let mensaje = '';
    if (tipo === 'cambio_estado') {
      mensaje = `Hola ${nombreCliente}, tu dispositivo ${dispositivo} (Orden #${orden.id}) ha cambiado de estado a: *${orden.estado}*.`;
    } else {
      mensaje = `Hola ${nombreCliente}, tu dispositivo ${dispositivo} (Orden #${orden.id}) está *Listo*. Por favor, califica nuestro servicio aquí: http://localhost:4200/solicitud`;
    }

    const payload = {
      cliente: nombreCliente,
      telefono: telefono, // Mandamos el teléfono real de la BD (ej. 4737563898)
      ordenId: String(orden.id),
      estado: orden.estado,
      dispositivo: dispositivo,
      mensajePersonalizado: mensaje
    };

    this.whatsappService.enviarNotificacion(payload).subscribe({
      next: () => alert(`✅ Mensaje enviado a ${nombreCliente} correctamente.`),
      error: (err) => {
        console.error('Error al enviar WhatsApp:', err);
        alert('❌ Hubo un error al conectar con n8n.');
      }
    });
  }
  
  // Filtramos las que no tienen técnico
  ordenesSinAsignar = computed(() => 
    this.todasLasOrdenes().filter(o => !o.idTecnico || o.idTecnico === 0)
  );
  
  // Filtramos las que tienen técnico Y que NO estén en estado "Listo"
  ordenesActivas = computed(() => 
    this.todasLasOrdenes().filter(o => 
      o.idTecnico && o.idTecnico > 0 && 
      o.estado !== 'Listo'
    )
  );

  // NUEVO: Filtramos las que ya están listas
  ordenesFinalizadas = computed(() => 
    this.todasLasOrdenes().filter(o => o.estado === 'Listo')
  );

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
            return !u.esAdmin && u.nivelPrivilegio === 1;
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
      next: (data) => this.todasLasOrdenes.set(data),
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

  // FINALIZAR ORDEN
  finalizarOrden(ordenId: number) {
    if (confirm('¿Estás seguro de que deseas marcar esta orden como Lista y finalizarla?')) {
      this.serviceOrderService.finalizarOrden(ordenId).subscribe({
        next: () => {
          alert(`¡Orden #${ordenId} marcada como Lista!`);
          this.cargarOrdenesPendientes(); 
          this.cargarReportes(); 
        },
        error: (err) => {
          console.error('Error al finalizar la orden:', err);
          alert('Hubo un problema al finalizar la orden.');
        }
      });
    }
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