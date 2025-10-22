// app/api/solicitudes/registro/route.ts
import { NextResponse } from 'next/server';
import { registrarSolicitud } from '@/actions/colaboradores/registro_solicitud';
import type { RegistroPayload } from '@/components/types/registro';

export async function POST(req: Request) {
  try {
    const fromStep = req.headers.get('x-from-step');
    if (fromStep !== '2') {
      return NextResponse.json({ message: 'Submit inválido (no proviene del Paso 2).' }, { status: 400 });
    }

    const body = (await req.json()) as RegistroPayload;
    if (!body?.administrador || !body?.negocio) {
      return NextResponse.json({ message: 'Payload inválido: falta administrador o negocio.' }, { status: 400 });
    }

    // Validación mínima (ya sin 'usuario')
    const { administrador: a, negocio: n } = body;
    for (const k of ['correo','telefono','nombre','apellido_paterno','apellido_materno','contrasena'] as const) {
      if (!a[k]?.toString().trim()) return NextResponse.json({ message: `Campo administrador.${k} es requerido.` }, { status: 400 });
    }
    for (const k of ['correo','telefono','nombre','rfc','cp','numero_ext','colonia','municipio','estado'] as const) {
      if (!n[k]?.toString().trim()) return NextResponse.json({ message: `Campo negocio.${k} es requerido.` }, { status: 400 });
    }

    // 🔻 delega: el action arma el FormData con claves con punto + file
    const res = await registrarSolicitud({ administrador: a, negocio: { ...n, estatus: 'En revision' } });

    if (!res.ok) {
      // No regreses HTML a la UI
      return NextResponse.json({ message: res.error ?? 'No se pudo enviar la solicitud.' }, { status: res.status ?? 500 });
    }

    return NextResponse.json({ message: 'Solicitud enviada', data: res.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'Error procesando la solicitud' }, { status: 500 });
  }
}
