export interface User {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  esAdmin?: boolean;
  rol?: string;
  nivelPrivilegio?: number;
}

export interface SignupRequest {
  Nombre: string;
  Telefono: string;
  Correo: string;
  Contrasena: string;
  Direccion?: string;
}

export interface LoginRequest {
  Correo: string;
  Contrasena: string;
}

export interface AuthResponse {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string;
  esAdmin: boolean;
  rol?: string;
  nivelPrivilegio?: number;
}