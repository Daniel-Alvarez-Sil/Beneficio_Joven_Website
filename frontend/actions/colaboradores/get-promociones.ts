"use server";

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
