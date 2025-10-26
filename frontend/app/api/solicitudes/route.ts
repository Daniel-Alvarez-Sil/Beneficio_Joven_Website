// app/api/solicitudes/route.ts

/**
 * Ruta API: GET /api/solicitudes
 * Descripción: Proxy en Next.js que invoca la Server Action `getSolicitudes`
 *              y retorna al cliente la lista de solicitudes.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Llama `getSolicitudes()` para consultar el backend (autenticación dentro de la acción).
 * 2) Extrae `data` si la respuesta es un `AxiosResponse`; si no, usa `result` tal cual.
 * 3) Si no hay datos, responde 502; si hay, responde con `NextResponse.json(data)`.
 * 4) Ante error, responde 500 con mensaje normalizado.
 */

import { NextResponse } from "next/server"
import { getSolicitudes } from "@/actions/administradores/get-solicitudes" // ⬅️ adjust path if different

export async function GET() {
  try {
    const result = await getSolicitudes()
    const data = (result as any)?.data ?? result
    if (!data) return NextResponse.json({ error: "No data" }, { status: 502 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 })
  }
}
