// app/api/negocios-resumen/route.ts

/**
 * Ruta API: GET /api/negocios-resumen
 * Descripción: Proxy en Next.js que invoca la Server Action `getResumenNegocios`
 *              y retorna el JSON con el resumen de negocios al cliente.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Llama `getResumenNegocios()` para consultar el backend (con autenticación en la acción).
 * 2) Extrae `data` si la respuesta es un `AxiosResponse`; en caso contrario usa `result` tal cual.
 * 3) Si no hay datos, responde 502; si hay datos, responde con `NextResponse.json(data)`.
 * 4) Manejo de errores: responde 500 con el mensaje del error (si existe) o "Failed".
 *
 * Notas:
 * - La ruta importada puede variar según tu estructura; ajusta el import si es necesario.
 */

import { NextResponse } from "next/server"
import { getResumenNegocios } from "@/actions/administradores/get-resumen-negocios"

export async function GET() {
  try {
    const result = await getResumenNegocios()
    const data = (result as any)?.data ?? result
    if (!data) return NextResponse.json({ error: "No data" }, { status: 502 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 })
  }
}
