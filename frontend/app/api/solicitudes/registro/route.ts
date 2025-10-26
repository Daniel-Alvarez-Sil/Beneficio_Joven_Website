// app/api/solicitudes/registro/route.ts

/**
 * Ruta API: POST /api/solicitudes/registro
 * Descripción: Valida el payload del registro (Paso 2 del flujo) y delega al Server Action
 *              `registrarSolicitud`, que arma el FormData y envía al backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Verifica header `x-from-step` === '2' para asegurar que proviene del paso correcto.
 * 2) Parsea el cuerpo JSON a `RegistroPayload` y valida presencia de `administrador` y `negocio`.
 * 3) Realiza validación mínima de campos requeridos para `administrador` y `negocio`.
 * 4) Llama `registrarSolicitud` (el action arma el FormData con claves con punto + file/base64).
 * 5) Responde JSON con el resultado (`200` si ok, `4xx/5xx` si error).
 *
 * Notas:
 * - No retorna HTML; solo JSON apto para UI.
 * - `estatus` se fuerza a 'En revision' al delegar la creación.
 */

import { NextResponse } from 'next/server';
import { registrarSolicitud } from '@/actions/colaboradores/registro_solicitud';
import type { RegistroPayload } from '@/components/types/registro';

export async function POST(req: Request) {
  try {
    // 1) Validación de origen del submit (solo se acepta desde Paso 2)
    const fromStep = req.headers.get('x-from-step');
    if (fromStep !== '2') {
      return NextResponse.json({ message: 'Submit inválido (no proviene del Paso 2).' }, { status: 400 });
    }

    // 2) Parseo y validación de estructura base
    const body = (await req.json()) as RegistroPayload;
    if (!body?.administrador || !body?.negocio) {
      return NextResponse.json({ message: 'Payload inválido: falta administrador o negocio.' }, { status: 400 });
    }

    // 3) Validación mínima de campos requeridos (admin)
    const { administrador: a, negocio: n } = body;
    for (const k of ['correo','telefono','nombre','apellido_paterno','apellido_materno','contrasena'] as const) {
      if (!a[k]?.toString().trim()) return NextResponse.json({ message: `Campo administrador.${k} es requerido.` }, { status: 400 });
    }
    // 3b) Validación mínima de campos requeridos (negocio)
    for (const k of ['correo','telefono','nombre','rfc','cp','numero_ext','colonia','municipio','estado'] as const) {
      if (!n[k]?.toString().trim()) return NextResponse.json({ message: `Campo negocio.${k} es requerido.` }, { status: 400 });
    }

    // 4) Delegación: el action arma el FormData con claves con punto + file/base64 y envía al backend
    const res = await registrarSolicitud({ administrador: a, negocio: { ...n, estatus: 'En revision' } });

    // 5) Respuesta uniforme para la UI
    if (!res.ok) {
      // No regreses HTML a la UI
      return NextResponse.json({ message: res.error ?? 'No se pudo enviar la solicitud.' }, { status: res.status ?? 500 });
    }

    return NextResponse.json({ message: 'Solicitud enviada', data: res.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? 'Error procesando la solicitud' }, { status: 500 });
  }
}
