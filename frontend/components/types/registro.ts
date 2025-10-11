export interface AdminNegocioInput {
  // id_negocio: se crea en el paso 2 (o en backend). Aquí no se pide todavía.
  correo: string;
  telefono: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  contraseña: string;
}

export interface NegocioInput {
  correo: string;
  telefono: string;
  nombre: string;
  rfc: string;
  sitio_web?: string;
  cp: string;
  numero_ext: string;
  numero_int?: string;
  colonia: string;
  municipio: string;
  estado: string;
  // logo: lo manejamos como string (URL/base64) para ejemplo simple
  logo?: string;
}

export interface SolicitudRegistroPayload {
  administrador_negocio: AdminNegocioInput;
  negocio: NegocioInput;
}
