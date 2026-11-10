import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  esAdmin?: boolean;
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
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private httpClient = inject(HttpClient);

  activeTab = signal<'add-user' | 'delete-user' | 'orders'>('add-user');

  addUserForm = { nombre: '', correo: '', contrasena: '', telefono: '', direccion: '' };
  addUserLoading = signal(false);
  addUserError = signal('');
  addUserSuccess = signal(false);

  users = signal<User[]>([]);
  deleteUserLoading = signal(false);
  deleteUserError = signal('');

  orders = signal<ServiceOrder[]>([]);
  ordersLoading = signal(false);
  ordersError = signal('');
  clientsMap = signal<ClientMap>({});

  ngOnInit(): void {
    this.loadUsers();
    this.loadOrders();
  }

  setActiveTab(tab: 'add-user' | 'delete-user' | 'orders'): void {
    this.activeTab.set(tab);
    if (tab === 'delete-user') this.loadUsers();
    else if (tab === 'orders') {
      this.loadUsers();
      this.loadOrders();
    }
  }

  getTecnicosList(): User[] {
    const allUsers = this.users();
    const admins = allUsers.filter(u => u.esAdmin === true);
    
    const uniqueAdmins: User[] = [];
    const seenNames = new Set<string>();

    for (const user of (admins.length > 0 ? admins : allUsers)) {
      const lowerName = user.nombre.trim().toLowerCase();
      if (!seenNames.has(lowerName) && !user.nombre.includes('Cliente') && !user.nombre.includes('Técnico Gael')) {
        seenNames.add(lowerName);
        uniqueAdmins.push(user);
      }
    }

    return uniqueAdmins;
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

    this.httpClient.post('http://localhost:5190/api/auth/signup', this.addUserForm).subscribe({
      next: () => {
        this.addUserLoading.set(false);
        this.addUserSuccess.set(true);
      },
      error: (err) => {
        console.error(err);
        this.addUserError.set('Error al crear el usuario.');
        this.addUserLoading.set(false);
      }
    });
  }

  resetAddUserForm(): void {
    this.addUserForm = { nombre: '', correo: '', contrasena: '', telefono: '', direccion: '' };
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