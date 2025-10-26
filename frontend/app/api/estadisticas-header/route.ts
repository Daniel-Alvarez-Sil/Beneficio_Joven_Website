// app/api/estadisticas-header/route.ts

/**
 * Ruta API: GET /api/estadisticas-header
 * Descripción: Proxy en Next.js que llama a la Server Action `getEstadisticasHeader`
 *              para obtener las estadísticas del encabezado y retorna el JSON al cliente.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Log de inicio para traza.
 * 2) Invoca `getEstadisticasHeader()` (Server Action) que consulta el backend con autenticación.
 * 3) Extrae `data` si la respuesta es un `AxiosResponse`; si no, usa `result` tal cual.
 * 4) Si no hay datos, responde 502; en caso contrario, responde con el JSON de datos.
 * 5) Ante excepción, responde 500 con mensaje genérico.
 *
 * Notas:
 * - No se altera la lógica del handler; solo se documenta.
 * - Ajusta la ruta de import si tu estructura difiere.
 */

import { NextResponse } from "next/server"
import { getEstadisticasHeader } from "@/actions/administradores/get-estadisticas-header" // ← adjust path if different

export async function GET() {
  try {
    console.log("Fetching header statistics... from API route");
    const result = await getEstadisticasHeader()
    // axios responses usually return { data }
    const data = (result as any)?.data ?? result
    console.log("Header statistics fetched:", data);
    if (!data) return NextResponse.json({ error: "No data" }, { status: 502 })

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch header stats" }, { status: 500 })
  }
}
