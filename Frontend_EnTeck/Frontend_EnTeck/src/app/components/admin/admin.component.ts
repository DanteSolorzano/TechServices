import { Component, signal, inject, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  nivelPrivilegio: number;
}

interface ServiceOrder {
  id: number;
  marca: string;
  modelo: string;
  problema: string;
  estado: string;
  fechaRecibido: string;
  eta: string;
  idCliente: number;
  idTecnico?: number;
  nombreTecnico?: string;
  fechaAsignacion?: string;
}

interface ClientMap {
  [key: number]: User;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-container">
      <div class="sidebar">
        <div class="logo-section">
          <span style="font-size: 24px;">⚙️</span>
          <h2 style="margin: 0; color: #fff;">Admin</h2>
        </div>
        
        <nav class="nav-menu">
          <button 
            (click)="setActiveTab('add-user')"
            [class.active]="activeTab() === 'add-user'"
            [disabled]="nivelPrivilegio === 1"
            class="nav-btn">
            <span>➕</span> Agregar Usuario
          </button>
          <button 
            (click)="setActiveTab('edit-user')"
            [class.active]="activeTab() === 'edit-user'"
            [disabled]="nivelPrivilegio === 1"
            class="nav-btn">
            <span>✏️</span> Modificar Usuarios
          </button>
          <button 
            (click)="setActiveTab('delete-user')"
            [class.active]="activeTab() === 'delete-user'"
            [disabled]="nivelPrivilegio === 1"
            class="nav-btn">
            <span>🗑️</span> Eliminar Usuario
          </button>
          <button 
            (click)="setActiveTab('orders')"
            [class.active]="activeTab() === 'orders'"
            class="nav-btn">
            <span>📋</span> Órdenes de Servicio
          </button>
        </nav>
      </div>

      <div class="main-content">
        @if (activeTab() === 'add-user') {
          <div class="section">
            <h1>Agregar Nuevo Usuario</h1>
            @if (addUserLoading()) {
              <div class="loading"><span class="spinner"></span> Creando usuario...</div>
            } @else if (addUserError()) {
              <div class="error-message">
                <p>{{ addUserError() }}</p>
                <button (click)="clearAddUserError()">Cerrar</button>
              </div>
            } @else if (addUserSuccess()) {
              <div class="success-message">
                <p>✅ Usuario creado exitosamente</p>
                <button (click)="resetAddUserForm()">Agregar otro usuario</button>
              </div>
            } @else {
              <form (ngSubmit)="submitAddUser()" class="form">
                <div class="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" [(ngModel)]="addUserForm.nombre" name="nombre" required placeholder="Juan Pérez">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" [(ngModel)]="addUserForm.correo" name="correo" required placeholder="juan@example.com">
                  </div>
                  <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" [(ngModel)]="addUserForm.contrasena" name="contrasena" required placeholder="••••••••">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" [(ngModel)]="addUserForm.telefono" name="telefono" required placeholder="+34 600 000 000">
                  </div>
                  <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" [(ngModel)]="addUserForm.direccion" name="direccion" required placeholder="Calle Principal 123">
                  </div>
                </div>
                <div class="form-group">
                  <label for="new-user-privilege">Nivel de privilegio</label>
                  <select id="new-user-privilege" [(ngModel)]="addUserForm.nivelPrivilegio" name="nivelPrivilegio" required>
                    <option [ngValue]="0">Administrador</option>
                    <option [ngValue]="1">Técnico</option>
                    <option [ngValue]="2">Cliente</option>
                  </select>
                </div>
                <button type="submit" class="submit-btn" [disabled]="!isAddUserFormValid()">Crear Usuario</button>
              </form>
            }
          </div>
        }

        @if (activeTab() === 'edit-user') {
          <div class="section">
            <h1>Modificar Usuarios</h1>
            @if (editUserLoading()) {
              <div class="loading"><span class="spinner"></span> Cargando usuarios...</div>
            } @else if (editUserError()) {
              <div class="error-message">
                <p>{{ editUserError() }}</p>
                <button (click)="editUserError.set('')">Cerrar</button>
              </div>
            } @else if (users().length === 0) {
              <div class="no-data"><p>No hay usuarios en la base de datos</p></div>
            } @else {
              <div class="edit-user-list">
                @for (user of users(); track user.id) {
                  <article class="edit-user-card">
                    <div class="edit-user-heading">
                      <div>
                        <h2>{{ user.nombre }}</h2>
                        <p>{{ user.correo }}</p>
                      </div>
                      <span class="role-badge" [class.admin-role]="user.nivelPrivilegio === 0" [class.technician-role]="user.nivelPrivilegio === 1">
                        {{ getPrivilegeLabel(user.nivelPrivilegio) }}
                      </span>
                    </div>
                    @if (editingUserId() === user.id) {
                      <form class="form edit-user-form" (ngSubmit)="saveUserChanges(user.id)">
                        <div class="form-group">
                          <label [for]="'name-' + user.id">Nombre</label>
                          <input [id]="'name-' + user.id" [(ngModel)]="editUserForm.nombre" name="nombre" required>
                        </div>
                        <div class="form-row">
                          <div class="form-group">
                            <label [for]="'email-' + user.id">Correo</label>
                            <input [id]="'email-' + user.id" type="email" [(ngModel)]="editUserForm.correo" name="correo" required>
                          </div>
                          <div class="form-group">
                            <label [for]="'phone-' + user.id">Teléfono</label>
                            <input [id]="'phone-' + user.id" type="tel" [(ngModel)]="editUserForm.telefono" name="telefono" required>
                          </div>
                        </div>
                        <div class="form-row">
                          <div class="form-group">
                            <label [for]="'address-' + user.id">Dirección</label>
                            <input [id]="'address-' + user.id" [(ngModel)]="editUserForm.direccion" name="direccion">
                          </div>
                          <div class="form-group">
                            <label [for]="'password-' + user.id">Nueva contraseña</label>
                            <input [id]="'password-' + user.id" type="password" [(ngModel)]="editUserForm.contrasena" name="contrasena" autocomplete="new-password" placeholder="Dejar vacía para conservarla">
                          </div>
                        </div>
                        <div class="form-group">
                          <label [for]="'privilege-' + user.id">Nivel de privilegio</label>
                          <select [id]="'privilege-' + user.id" [(ngModel)]="editUserForm.nivelPrivilegio" name="nivelPrivilegio" required>
                            <option [ngValue]="0">Administrador</option>
                            <option [ngValue]="1">Técnico</option>
                            <option [ngValue]="2">Cliente</option>
                          </select>
                        </div>
                        <div class="edit-user-actions">
                          <button type="button" class="cancel-btn" (click)="cancelUserEdit()">Cancelar</button>
                          <button type="submit" class="submit-btn" [disabled]="savingUser()">{{ savingUser() ? 'Guardando...' : 'Guardar cambios' }}</button>
                        </div>
                      </form>
                    } @else {
                      <div class="edit-user-summary">
                        <span>Teléfono: {{ user.telefono }}</span>
                        <span>Dirección: {{ user.direccion || 'Sin dirección' }}</span>
                        <button type="button" class="edit-btn" (click)="startUserEdit(user)">Editar usuario</button>
                      </div>
                    }
                  </article>
                }
              </div>
            }
          </div>
        }

        @if (activeTab() === 'delete-user') {
          <div class="section">
            <h1>Eliminar Usuario</h1>
            @if (deleteUserLoading()) {
              <div class="loading"><span class="spinner"></span> Cargando usuarios...</div>
            } @else if (deleteUserError()) {
              <div class="error-message">
                <p>{{ deleteUserError() }}</p>
                <button (click)="clearDeleteUserError()">Cerrar</button>
              </div>
            } @else {
              <div class="users-list">
                @if (users().length > 0) {
                  @for (user of users(); track user.id) {
                    <div class="user-card">
                      <div class="user-info">
                        <h3>{{ user.nombre }}</h3>
                        <p class="email">{{ user.correo }}</p>
                        <p class="phone">📱 {{ user.telefono }}</p>
                        <p class="address">📍 {{ user.direccion }}</p>
                      </div>
                      <button class="delete-btn" (click)="deleteUser(user.id)">Eliminar</button>
                    </div>
                  }
                } @else {
                  <div class="no-data"><p>No hay usuarios en la base de datos</p></div>
                }
              </div>
            }
          </div>
        }

        @if (activeTab() === 'orders') {
          <div class="section">
            <h1>Órdenes de Servicio (US-011 & US-012)</h1>
            @if (ordersLoading()) {
              <div class="loading"><span class="spinner"></span> Cargando órdenes...</div>
            } @else if (ordersError()) {
              <div class="error-message">
                <p>{{ ordersError() }}</p>
                <button (click)="clearOrdersError()">Cerrar</button>
              </div>
            } @else {
              <div class="orders-list">
                @if (orders().length > 0) {
                  @for (order of orders(); track order.id) {
                    <div class="order-card">
                      <div class="order-header">
                        <div>
                          <h3>{{ order.marca }} {{ order.modelo }}</h3>
                          <p class="problem">{{ order.problema }}</p>
                        </div>
                        <span class="order-id">ID: {{ order.id }}</span>
                      </div>
                      
                      <div class="order-details">
                        <div class="detail-row">
                          <span class="label">Cliente:</span>
                          <span>{{ getClientName(order.idCliente) }} (ID: {{ order.idCliente }})</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Estado Actual:</span>
                          <span class="status-badge" [ngClass]="'badge-' + getStatusBadgeClass(order.estado)">
                            {{ order.estado || 'Pendiente' }}
                          </span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Recibido:</span>
                          <span>{{ formatDate(order.fechaRecibido) }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">ETA Actual:</span>
                          <span><strong>{{ formatDate(order.eta) }}</strong></span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Técnico Asignado:</span>
                          <strong>{{ order.nombreTecnico || 'Sin asignar' }}</strong>
                        </div>

                        <!-- Selector US-011: Asignación de Técnico -->
                        <div class="assign-section" style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;">
                          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #333;">Asignar Técnico:</label>
                          <div style="display: flex; gap: 10px;">
                            <select #techSelect style="flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #ccc; background: white;">
                              <option value="">Selecciona un técnico...</option>
                              @for (user of getTecnicosList(); track user.id) {
                                <option [value]="user.id + '|' + user.nombre" [selected]="order.idTecnico === user.id">
                                  👤 {{ user.nombre }}
                                </option>
                              }
                            </select>
                            <button 
                              (click)="assignTechnician(order.id, techSelect.value)"
                              style="padding: 8px 18px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                              Asignar
                            </button>
                          </div>
                        </div>

                        <!-- Selector US-012: Actualización de Estado & ETA -->
                        <div class="status-eta-section" style="margin-top: 10px; padding: 12px; background: #f0f7ff; border-radius: 8px; border: 1px solid #bae6fd;">
                          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: #0369a1;">Actualizar Estado y ETA (US-012):</label>
                          <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: center;">
                            <select #statusSelect style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; background: white;">
                              <option value="Pendiente" [selected]="order.estado === 'Pendiente'">Pendiente</option>
                              <option value="En Proceso" [selected]="order.estado === 'En Proceso'">En Proceso</option>
                              <option value="Esperando Refacción" [selected]="order.estado === 'Esperando Refacción'">Esperando Refacción</option>
                              <option value="Reparado" [selected]="order.estado === 'Reparado'">Reparado</option>
                              <option value="Entregado" [selected]="order.estado === 'Entregado'">Entregado</option>
                            </select>

                            <input #etaInput type="date" [value]="getRawDate(order.eta)" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; background: white;" />

                            <button 
                              (click)="updateStatusAndEta(order.id, statusSelect.value, etaInput.value)"
                              style="padding: 8px 15px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                              Guardar
                            </button>
                          </div>
                        </div>

                        <!-- Botón WhatsApp (US-012) -->
                        <div class="detail-row" style="margin-top: 15px;">
                          <button 
                            (click)="sendWhatsAppMessage(order)"
                            style="width: 100%; justify-content: center; padding: 10px 20px; background: #25D366; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px; font-size: 15px;">
                            📱 Notificar al Cliente por WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                } @else {
                  <div class="no-data"><p>No hay órdenes de servicio en la base de datos</p></div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-container { display: flex; min-height: 100vh; background: #f4f7f6; }
    .sidebar { width: 250px; background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 20px; position: sticky; top: 0; height: 100vh; }
    .logo-section { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #00e5ff; }
    .nav-menu { display: flex; flex-direction: column; gap: 10px; }
    .nav-btn { padding: 12px 15px; background: transparent; color: #ccc; border: 1px solid #444; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.3s; display: flex; align-items: center; gap: 10px; }
    .nav-btn.active, .nav-btn:hover { background: #00e5ff; color: #1a1a1a; border-color: #00e5ff; }
    .main-content { flex: 1; padding: 40px; overflow-y: auto; }
    .section h1 { color: #333; margin-bottom: 30px; font-size: 28px; }
    .form { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    label { font-weight: 600; color: #444; font-size: 14px; }
    input, select { padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
    .submit-btn { padding: 12px 30px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .submit-btn:disabled { background: #ccc; cursor: not-allowed; }
    .loading, .no-data { text-align: center; padding: 40px; background: white; border-radius: 12px; color: #007bff; font-weight: bold; }
    .spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px; }
    .error-message { background: #ffebee; color: #c62828; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f; }
    .success-message { background: #e8f5e9; color: #1b5e20; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; }
    .users-list, .orders-list { display: grid; gap: 20px; }
    .user-card, .order-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .order-card { border-left: 4px solid #007bff; }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
    .order-id { background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .order-details { display: flex; flex-direction: column; gap: 8px; }
    .detail-row { display: flex; justify-content: space-between; font-size: 14px; }
    .label { font-weight: 600; color: #555; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge-pendiente { background: #fff3e0; color: #e65100; }
    .badge-en-proceso { background: #e3f2fd; color: #0d47a1; }
    .badge-esperando-refaccion { background: #fef3c7; color: #92400e; }
    .badge-reparado { background: #dcfce7; color: #166534; }
    .badge-entregado { background: #f3e8ff; color: #6b21a8; }
    .delete-btn { padding: 8px 20px; background: #ff4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class AdminComponent implements OnInit {
  private httpClient = inject(HttpClient);

  @Input() nivelPrivilegio = 0;

  activeTab = signal<'add-user' | 'edit-user' | 'delete-user' | 'orders'>('add-user');

  addUserForm = { nombre: '', correo: '', contrasena: '', telefono: '', direccion: '', nivelPrivilegio: 2 };
  addUserLoading = signal(false);
  addUserError = signal('');
  addUserSuccess = signal(false);

  users = signal<User[]>([]);
  deleteUserLoading = signal(false);
  deleteUserError = signal('');
  editUserLoading = signal(false);
  editUserError = signal('');
  editingUserId = signal<number | null>(null);
  savingUser = signal(false);
  editUserForm = { nombre: '', correo: '', telefono: '', direccion: '', contrasena: '', nivelPrivilegio: 2 };

  orders = signal<ServiceOrder[]>([]);
  ordersLoading = signal(false);
  ordersError = signal('');
  clientsMap = signal<ClientMap>({});

  ngOnInit(): void {
    if (this.nivelPrivilegio === 1) {
      this.activeTab.set('orders');
    }
    this.loadUsers();
    this.loadOrders();
  }

  setActiveTab(tab: 'add-user' | 'edit-user' | 'delete-user' | 'orders'): void {
    if (this.nivelPrivilegio === 1 && tab !== 'orders') return;
    this.activeTab.set(tab);
    if (tab === 'edit-user') this.loadUsersForEditing();
    else if (tab === 'delete-user') this.loadUsers();
    else if (tab === 'orders') {
      this.loadUsers();
      this.loadOrders();
    }
  }

  getTecnicosList(): User[] {
    const technicians = this.users().filter(user => user.nivelPrivilegio === 1);
    
    const uniqueAdmins: User[] = [];
    const seenNames = new Set<string>();

    for (const user of technicians) {
      const lowerName = user.nombre.trim().toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueAdmins.push(user);
      }
    }

    return uniqueAdmins;
  }

  getPrivilegeLabel(level: number): string {
    if (level === 0) return 'Administrador';
    if (level === 1) return 'Técnico';
    return 'Cliente';
  }

  getClientName(clientId: number): string {
    const client = this.clientsMap()[clientId];
    return client ? client.nombre : 'Desconocido';
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'pendiente';
    return status.toLowerCase().trim().replace(/\s+/g, '-');
  }

  getRawDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  isAddUserFormValid(): boolean {
    return !!(this.addUserForm.nombre && this.addUserForm.correo && 
              this.addUserForm.contrasena && this.addUserForm.telefono && 
              this.addUserForm.direccion);
  }

  submitAddUser(): void {
    if (!this.isAddUserFormValid() || this.addUserLoading()) return;
    this.addUserLoading.set(true);
    this.addUserError.set('');

    this.httpClient.post('http://localhost:5190/api/clientes', this.addUserForm).subscribe({
      next: () => {
        this.addUserLoading.set(false);
        this.addUserSuccess.set(true);
      },
      error: (err) => {
        console.error(err);
        this.addUserError.set(err.status === 409
          ? 'Ese correo ya está registrado en otra cuenta.'
          : 'Error al crear el usuario. Verifica los datos e intenta de nuevo.');
        this.addUserLoading.set(false);
      }
    });
  }

  resetAddUserForm(): void {
    this.addUserForm = { nombre: '', correo: '', contrasena: '', telefono: '', direccion: '', nivelPrivilegio: 2 };
    this.addUserSuccess.set(false);
  }

  clearAddUserError(): void { this.addUserError.set(''); }

  private loadUsers(): void {
    this.deleteUserLoading.set(true);
    this.httpClient.get<User[]>('http://localhost:5190/api/clientes').subscribe({
      next: (data) => {
        this.users.set(data);
        this.deleteUserLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.deleteUserError.set('Error al cargar usuarios');
        this.deleteUserLoading.set(false);
      }
    });
  }

  deleteUser(userId: number): void {
    this.httpClient.delete(`http://localhost:5190/api/clientes/${userId}`).subscribe({
      next: () => this.users.set(this.users().filter(u => u.id !== userId)),
      error: (err) => console.error(err)
    });
  }

  clearDeleteUserError(): void { this.deleteUserError.set(''); }

  private loadUsersForEditing(): void {
    this.editUserLoading.set(true);
    this.editUserError.set('');
    this.httpClient.get<User[]>('http://localhost:5190/api/clientes').subscribe({
      next: (data) => {
        this.users.set(data);
        this.editUserLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios para edición:', err);
        this.editUserError.set('No se pudieron cargar los usuarios. Intenta de nuevo.');
        this.editUserLoading.set(false);
      }
    });
  }

  startUserEdit(user: User): void {
    this.editUserForm = {
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      direccion: user.direccion ?? '',
      contrasena: '',
      nivelPrivilegio: user.nivelPrivilegio
    };
    this.editUserError.set('');
    this.editingUserId.set(user.id);
  }

  cancelUserEdit(): void {
    this.editingUserId.set(null);
    this.editUserError.set('');
  }

  saveUserChanges(userId: number): void {
    if (this.savingUser()) return;
    this.savingUser.set(true);
    this.editUserError.set('');

    this.httpClient.put<User>(`http://localhost:5190/api/clientes/${userId}`, this.editUserForm).subscribe({
      next: (updatedUser) => {
        this.users.update(currentUsers => currentUsers.map(user => user.id === userId ? updatedUser : user));
        this.editingUserId.set(null);
        this.savingUser.set(false);
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
        this.editUserError.set(err.status === 409
          ? 'Ese correo ya está registrado en otra cuenta.'
          : 'No se pudo actualizar el usuario. Verifica los datos e intenta de nuevo.');
        this.savingUser.set(false);
      }
    });
  }

  private loadOrders(): void {
    this.ordersLoading.set(true);
    this.httpClient.get<User[]>('http://localhost:5190/api/clientes').subscribe({
      next: (clients) => {
        const clientMap: ClientMap = {};
        clients.forEach(c => clientMap[c.id] = c);
        this.clientsMap.set(clientMap);

        this.httpClient.get<ServiceOrder[]>('http://localhost:5190/api/solicitudes/pendientes').subscribe({
          next: (data) => {
            this.orders.set(data);
            this.ordersLoading.set(false);
          },
          error: (err) => {
            console.error(err);
            this.ordersError.set('Error al cargar órdenes');
            this.ordersLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.ordersError.set('Error al cargar clientes');
        this.ordersLoading.set(false);
      }
    });
  }

 assignTechnician(orderId: number, selectedValue: string): void {
    if (!selectedValue) return;

    const [idTecnicoStr, nombreTecnico] = selectedValue.split('|');
    const payload = {
      idTecnico: parseInt(idTecnicoStr, 10),
      nombreTecnico: nombreTecnico
    };

    this.httpClient.put(`http://localhost:5190/api/solicitudes/${orderId}/asignar`, payload).subscribe({
      next: () => {
        alert(`¡Técnico ${nombreTecnico} asignado exitosamente!`);
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error al asignar técnico:', err);
        alert('Error al asignar técnico.');
      }
    });
  }

  updateStatusAndEta(orderId: number, estado: string, eta: string): void {
    const payload = { estado, eta };

    this.httpClient.put(`http://localhost:5190/api/solicitudes/${orderId}/asignar`, payload).subscribe({
      next: (res: any) => {
        alert(`¡Estado actualizado a "${estado}" y ETA guardado correctamente!`);
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error al actualizar estado/ETA:', err);
        alert('Error al actualizar estado/ETA.');
      }
    });
  }

  clearOrdersError(): void { this.ordersError.set(''); }

  getWhatsAppLink(order: ServiceOrder): string {
    const client = this.clientsMap()[order.idCliente];
    if (!client) return '';

    const phoneNumber = client.telefono.replace(/\D/g, '');
    const clientName = client.nombre;
    const device = `${order.marca} ${order.modelo}`;
    const status = order.estado || 'Pendiente';
    const tech = order.nombreTecnico || 'Por asignar';
    const etaFormatted = this.formatDate(order.eta);

    const message = `Hola ${clientName}, en EnTeck te informamos sobre la orden #${order.id} (${device}):\n\n` +
                    `📌 Estado: ${status}\n` +
                    `👨‍🔧 Técnico: ${tech}\n` +
                    `📅 Entrega estimada (ETA): ${etaFormatted}\n\n` +
                    `¡Quedamos a tu servicio!`;

    return `https://wa.me/${phoneNumber}/?text=${encodeURIComponent(message)}`;
  }

  sendWhatsAppMessage(order: ServiceOrder): void {
    const link = this.getWhatsAppLink(order);
    if (link) window.open(link, '_blank');
  }

  formatDate(dateStr: string): string {
    if (!dateStr || dateStr === 'N/A') return 'Por confirmar';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}