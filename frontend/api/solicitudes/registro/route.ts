import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json(); // payload con admin_negocio + negocio
    console.log('Solicitud de registro recibida:', data);
    return NextResponse.json({ ok: true, message: 'Solicitud recibida.' });
  } catch {
    return NextResponse.json({ ok: false, message: 'Error procesando solicitud' }, { status: 400 });
  }
}
