// =============================================
// File: app/actions/promociones/estadisticas.ts
// Server Action para obtener las estadísticas
// =============================================
"use server";

import axios from "axios";
import { withAuthRetry } from "@/lib/login/auth-wrapper";

const apiHost = process.env.API_HOST;

export type EstadisticaPromo = {
  titulo: string;
  numero_de_canjes: number | string;
};

export type EstadisticasResponse = {
  num_canjes_total_de_todas_las_promociones: number | string;
  "5_promociones_con_mas_canjes": EstadisticaPromo[];
  historico_de_canjes_ultimos_siete_dias: any[];
  "5_promociones_con_menos_canjes": EstadisticaPromo[];
};

/**
 * Obtiene las estadísticas de promociones para un negocio.
 * @param idNegocio string (por ejemplo "3")
 */
export async function getEstadisticas(
): Promise<EstadisticasResponse> {


  const result = await withAuthRetry((token: string) =>
    axios.get(`${apiHost}/functionality/promociones/estadisticas/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  // Soporta que withAuthRetry regrese el response completo o sólo .data
  const data = (result as any)?.data ?? result;
  return data as EstadisticasResponse;
}
