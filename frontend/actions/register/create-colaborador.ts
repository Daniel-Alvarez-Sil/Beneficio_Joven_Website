// actions/register/create-colaborador.ts
'use server' 

/**
 * Módulo: actions/register/create-colaborador
 * Descripción: Server Action que crea un administrador/colaborador de negocio en el backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Parámetros:
 * - form_data: `any` — Cuerpo a enviar al endpoint. Puede ser `FormData` u objeto
 *   con los campos requeridos por la API (según implementación del backend).
 *
 * Flujo:
 * 1) Registra logs para trazar la operación y el contenido de `form_data`.
 * 2) Usa `withAuthRetry` para obtener/inyectar el Bearer token y realizar el POST.
 * 3) Devuelve `true` si el wrapper no reporta error; `false` en caso contrario.
 *
 * Notas:
 * - Requiere `API_HOST` en variables de entorno.
 * - Endpoint: `/functionality/administradores-negocio/`
 * - Autenticación: `Authorization: Bearer <token>` manejado por `withAuthRetry`.
 */

import axios from "axios" 

import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function createColaborador(form_data: any) {
  console.log("Vamos por colaborador");
  console.log(form_data);
  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/administradores-negocio/`, form_data, { headers: { Authorization: `Bearer ${token}` } })
  );
  return result && !(result as any).error; // Return true if no error, false otherwise
}
