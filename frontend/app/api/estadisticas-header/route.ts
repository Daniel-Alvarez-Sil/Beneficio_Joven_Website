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
