import { NextResponse } from 'next/server';
import { registrarSolicitud } from '@/actions/colaboradores/registro_solicitud';
import type { RegistroPayload } from '@/components/types/registro';

export async function POST(req: Request) {
  try {
    console.log('[route] HIT /api/solicitudes/registro');

    const fromStep = req.headers.get('x-from-step');
    console.log('[route] x-from-step:', fromStep);
    if (fromStep !== '2') {
      console.warn('[route] Bloqueado por x-from-step');
      return NextResponse.json({ message: 'Submit inválido (no proviene del Paso 2).' }, { status: 400 });
    }

    const body = (await req.json()) as RegistroPayload;
    console.log('[route] body recibido:', Object.keys(body || {}));

    if (!body?.administrador || !body?.negocio) {
      console.warn('[route] Falta administrador o negocio');
      return NextResponse.json({ message: 'Payload inválido: falta administrador o negocio.' }, { status: 400 });
    }

    const admin = body.administrador;
    const negocio = { ...body.negocio, estatus: 'En revision' };

    const requiredAdmin = ['correo','telefono','nombre','apellido_paterno','apellido_materno','usuario','contrasena'] as const;
    const requiredNegocio = ['correo','telefono','nombre','rfc','cp','numero_ext','colonia','municipio','estado'] as const;

    for (const k of requiredAdmin) {
      if (!admin[k]?.toString().trim()) {
        console.warn('[route] falta admin.' + k);
        return NextResponse.json({ message: `Campo administrador.${k} es requerido.` }, { status: 400 });
      }
    }
    for (const k of requiredNegocio) {
      if (!negocio[k]?.toString().trim()) {
        console.warn('[route] falta negocio.' + k);
        return NextResponse.json({ message: `Campo negocio.${k} es requerido.` }, { status: 400 });
      }
    }

    const payload: RegistroPayload = { administrador: admin, negocio };
    console.log('[route] llamando registrarSolicitud…');

    const res = await registrarSolicitud(payload);

    console.log('[route] registrarSolicitud respondió:', res?.status, res?.ok);
    if (!res.ok) {
      console.error('[route] registrarSolicitud error:', res.status, res.error);
      return NextResponse.json(
        { message: res.error ?? 'No se pudo enviar la solicitud.' },
        { status: res.status ?? 500 }
      );
    }

    return NextResponse.json({ message: 'Solicitud enviada', data: res.data }, { status: 200 });
  } catch (e: any) {
    console.error('[route] exception:', e);
    return NextResponse.json({ message: e?.message ?? 'Error procesando la solicitud' }, { status: 500 });
  }
}
