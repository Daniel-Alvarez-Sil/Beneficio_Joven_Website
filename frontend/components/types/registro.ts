// components/types/registro.ts
export interface AdminInput {
  correo: string;
  telefono: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  contrasena: string;
}

export interface NegocioInput {
  correo: string;
  telefono: string;
  nombre: string;
  rfc: string;
  sitio_web?: string;
  estatus: "En Revision" | "En revision" | "Aprobado" | "Rechazado";
  cp: string;
  numero_ext: string;
  numero_int?: string;
  colonia: string;
  municipio: string;
  estado: string;
  logo?: string; // base64 o url
}

export interface RegistroPayload {
  negocio: NegocioInput;
  administrador: AdminInput;
}
