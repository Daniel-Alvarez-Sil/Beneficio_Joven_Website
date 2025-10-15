import { NextResponse } from "next/server"
import { getResumenNegocios } from "@/actions/administradores/get-resumen-negocios" // ← ⬅️ adjust path to your 'use server' file

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
