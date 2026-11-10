export interface ServiceOrder {
  id: number;
  marca: string;
  modelo: string;
  problema: string;
  estado: string;
  fechaRecibido: string;
  eta?: string;
  idCliente: number;
  telefonoCliente?: string;
  telefono?: string;
  idTecnico?: number;
  nombreTecnico?: string;
  fechaAsignacion?: string;
  diagnostico?: string;
  piezasUtilizadas?: string;
}

export interface RendimientoTecnico {
  tecnicoId: number;
  nombreTecnico: string;
  ordenesAsignadas: number;
  ordenesFinalizadas: number;
  ordenesEnProceso: number;
}

export interface ReporteRendimiento {
  totalOrdenes: number;
  completadas: number;
  enProceso: number;
  pendientes: number;
  rendimientoTecnicos: RendimientoTecnico[];
}