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
