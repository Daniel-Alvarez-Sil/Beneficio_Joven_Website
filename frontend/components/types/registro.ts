// components/types/registro.ts

/**
 * Archivo de tipos para el flujo de registro de negocios/administradores.
 *
 * Contenido:
 * - AdminInput: datos del administrador del negocio.
 * - EstatusNegocio: estados posibles del negocio en el flujo.
 * - NegocioInput: datos del negocio (contacto, ubicación y archivo).
 * - RegistroPayload: payload completo que agrupa negocio + administrador.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

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
