import { Component, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
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
  styles: [`
    .admin-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; }
    .admin-panel { background: white; width: 90%; max-width: 1050px; height: 88vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    
    .admin-header { background: #1a1a1a; color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .admin-header h2 { margin: 0; font-size: 1.5rem; }
    .close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }

    .admin-content { flex: 1; overflow-y: auto; padding: 2rem; }

    /* Tabs */
    .tabs-nav { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #eee; overflow-x: auto; }
    .tab-btn { padding: 10px 20px; background: none; border: none; font-weight: bold; cursor: pointer; color: #666; border-bottom: 3px solid transparent; white-space: nowrap; }
    .tab-btn.active { color: #007bff; border-bottom-color: #007bff; }

    /* Tabla */
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { text-align: left; padding: 1rem; background: #f4f4f4; color: #333; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 1rem; border-bottom: 1px solid #eee; vertical-align: middle; }
    tr:hover { background: #f9f9f9; }

    .stock-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .in-stock { background: #e8f5e9; color: #2e7d32; }
    .low-stock { background: #fff3e0; color: #ef6c00; }
    .tech-stock { background: #e3f2fd; color: #1565c0; }
    .out-stock { background: #ffebee; color: #c62828; }

    /* Métricas / Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; }
    .kpi-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-left: 5px solid #007bff; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .kpi-card h4 { margin: 0 0 5px 0; font-size: 13px; color: #666; text-transform: uppercase; }
    .kpi-card .number { font-size: 28px; font-weight: bold; color: #222; }

    .filter-bar { display: flex; gap: 10px; align-items: center; background: #f0f4f8; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-bar label { font-size: 12px; font-weight: bold; color: #444; }
    .filter-bar input[type="date"] { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; }

    /* Formulario */
    .edit-form { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #ddd; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { font-size: 12px; font-weight: bold; color: #555; }
    .form-group input, .form-group select, .form-group textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    
    .actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
    .btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; }
    .btn-primary { background: #007bff; color: white; }
    .btn-cancel { background: #ccc; color: #333; }
    .btn-delete { background: #dc3545; color: white; padding: 5px 10px; font-size: 12px; }
    .btn-edit { background: #ffc107; color: #333; padding: 5px 10px; font-size: 12px; margin-right: 5px; }
    .btn-add { background: #28a745; color: white; margin-bottom: 20px; }
    .select-tec { padding: 6px; border-radius: 4px; border: 1px solid #007bff; background: #f0f7ff; font-size: 12px; font-weight: bold; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  @Output() closeAdmin = new EventEmitter<void>();

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
        console.error('Error al registrar usuario:', err);
        alert('Hubo un problema al crear el usuario.');
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

  close() {
    this.closeAdmin.emit();
  }
}