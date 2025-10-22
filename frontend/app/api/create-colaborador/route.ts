import { NextRequest, NextResponse } from "next/server";
import { createColaborador } from "@/actions/register/create-colaborador"; // <-- your file that contains the provided 'use server' function

export async function POST(req: NextRequest) {
  try {
    // Grab multipart/form-data from the client
    const formData = await req.formData();

    // Forward the FormData to your server-side axios call
    // Note: The provided createColaborador expects a FormData-like object.
    const ok = await createColaborador(formData);

    if (!ok) {
      return NextResponse.json({ ok: false, message: "Fallo al crear colaborador" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.response?.data?.detail || err?.message || "Error inesperado";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
