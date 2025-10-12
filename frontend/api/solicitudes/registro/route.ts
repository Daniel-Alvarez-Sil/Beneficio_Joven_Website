import { NextResponse } from 'next/server';
import { registrarSolicitud } from '@/actions/colaboradores/registro_solicitud';
import type { RegistroPayload } from '@/components/types/registro';

export async function POST(req: Request) {
  try {
    // 🔒 Solo aceptamos si viene explícitamente del Paso 2
    const fromStep = req.headers.get('x-from-step');
    if (fromStep !== '2') {
      return NextResponse.json(
        { message: 'Submit inválido (no proviene del Paso 2).' },
        { status: 400 }
      );
    }

    const body = (await req.json()) as RegistroPayload;

    if (!body?.administrador || !body?.negocio) {
      return NextResponse.json(
        { message: 'Payload inválido: falta administrador o negocio.' },
        { status: 400 }
      );
    }

    const admin = body.administrador;
    const negocio = { ...body.negocio, estatus: 'En revision' };

    const requiredAdmin = ['correo','telefono','nombre','apellido_paterno','apellido_materno','usuario','contrasena'] as const;
    const requiredNegocio = ['correo','telefono','nombre','rfc','cp','numero_ext','colonia','municipio','estado'] as const;

    for (const k of requiredAdmin) {
      if (!admin[k]?.toString().trim()) {
        return NextResponse.json({ message: `Campo administrador.${k} es requerido.` }, { status: 400 });
      }
    }
    for (const k of requiredNegocio) {
      if (!negocio[k]?.toString().trim()) {
        return NextResponse.json({ message: `Campo negocio.${k} es requerido.` }, { status: 400 });
      }
    }

    const payload: RegistroPayload = { administrador: admin, negocio };
    const res = await registrarSolicitud(payload);
    if (!res.ok) {
      return NextResponse.json(
        { message: res.error ?? 'No se pudo enviar la solicitud.' },
        { status: res.status ?? 500 }
      );
    }

    return NextResponse.json({ message: 'Solicitud enviada', data: res.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'Error procesando la solicitud' }, { status: 500 });
  }
}
