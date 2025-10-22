// components/types/registro.ts
export interface AdminInput {
  correo: string;
  telefono: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  contrasena: string;
}

export type EstatusNegocio = 'En revision' | 'En Revision' | 'Aprobado' | 'Rechazado';

export interface NegocioInput {
  correo: string;
  telefono: string;
  nombre: string;
  rfc: string;
  sitio_web?: string;
  maps_url?: string;
  estatus: EstatusNegocio;
  cp: string;
  numero_ext: string;
  numero_int?: string;
  colonia: string;
  municipio: string;
  estado: string;
  file?: string; // base64 o url
}

export interface RegistroPayload {
  negocio: NegocioInput;
  administrador: AdminInput;
}
