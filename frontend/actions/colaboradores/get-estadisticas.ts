// actions/colaboradores/estadisticas.ts
"use server";

/**
 * Módulo: acciones/colaboradores/estadisticas
 * Descripción: Server Action que obtiene estadísticas agregadas de promociones para el negocio autenticado.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Contenido:
 * - Tipos `EstadisticaPromo` y `EstadisticasResponse` que describen la forma esperada de la respuesta.
 * - Función `getEstadisticas` que realiza una petición GET autenticada al backend.
 *
 * Flujo de `getEstadisticas`:
 * 1) Inyecta el Bearer token mediante `withAuthRetry`.
 * 2) Llama al endpoint `/functionality/promociones/estadisticas/`.
 * 3) Tolera que `withAuthRetry` regrese un `AxiosResponse` (usando `.data`) o directamente los datos.
 * 4) Retorna los datos tipados como `EstadisticasResponse`.
 *
 * Notas:
 * - Requiere variable de entorno `API_HOST`.
 * - Autenticación: encabezado `Authorization: Bearer <token>`.
 */

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
 * @returns {Promise<EstadisticasResponse>} Objeto con totales, top 5/low 5 y serie histórica de canjes.
 */
export async function getEstadisticas(
): Promise<EstadisticasResponse> {

  // Llamada autenticada al endpoint de estadísticas de promociones
  const result = await withAuthRetry((token: string) =>
    axios.get(`${apiHost}/functionality/promociones/estadisticas/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  // Soporta que withAuthRetry regrese el response completo o sólo .data
  const data = (result as any)?.data ?? result;
  return data as EstadisticasResponse;
}
