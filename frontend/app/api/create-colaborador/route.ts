// app/api/create-colaborador/route.ts
import { NextResponse } from 'next/server';
import { registrarSolicitud } from '@/actions/colaboradores/registro_solicitud';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const resp = await registrarSolicitud(formData);

    if (!resp.ok) {
      return NextResponse.json(
        { ok: false, message: resp.error || `Backend ${resp.status}` },
        { status: resp.status || 400 }
      );
    }

    return NextResponse.json({ ok: true, data: resp.data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message ?? 'Error inesperado' },
      { status: 500 }
    );
  }
}
