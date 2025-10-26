// actions/colaboradores/get-promociones.ts
"use server";

/**
 * Módulo: actions/colaboradores/get-promociones
 * Descripción: Server Action que obtiene la lista de promociones del backend con autenticación.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Verifica que exista la variable de entorno `API_HOST`.
 * 2) Construye la URL del endpoint `/functionality/list/promociones/`.
 * 3) Usa `withAuthRetry` para hacer un `GET` autenticado con Bearer token.
 * 4) Tolera que el wrapper regrese `AxiosResponse` (usando `.data`) o directamente los datos.
 * 5) Valida que la respuesta sea un arreglo; si no lo es, lanza un error.
 * 6) Retorna el arreglo tipado como `Promocion[]`.
 *
 * Notas:
 * - Este módulo exporta el tipo `Promocion` para consumo en componentes cliente.
 * - Si el backend soporta filtros por negocio, se podrían añadir como query params a `url`.
 * - Errores del backend se normalizan para ofrecer un mensaje claro.
 */

import axios from "axios";
import { withAuthRetry } from "@/lib/login/auth-wrapper";

const apiHost = process.env.API_HOST;

export type Promocion = {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string | null;
  porcentaje: string; // "15.00"
  precio: string;     // "85.00000"
  activo: boolean;
  numero_canjeados: number;
  imagen?: string | null;
};

/**
 * Server Action: fetch promociones from your backend with auth.
 * Kept as your service, but now returns data and is callable from Client Components.
 */
export async function getPromociones() {

  if (!apiHost) {
    throw new Error("API_HOST is not configured");
  }

  // Optional: forward negocio filter if your backend supports it.
  const url = new URL(`${apiHost}/functionality/list/promociones/`);

  try {
    const resp = await withAuthRetry((token: string) =>
      axios.get(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    // Handle either axios response or raw data (depending on your withAuthRetry impl)
    const data = (resp as any)?.data ?? resp;

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format: expected an array");
    }

    return data as Promocion[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ??
      err?.response?.data?.error ??
      err?.message ??
      "Error fetching promociones";
    throw new Error(msg);
  }
}
