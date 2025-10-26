// app/api/create-colaborador/route.ts

/**
 * Ruta API: POST /api/create-colaborador
 * Descripción: Proxy en Next.js que recibe un `FormData` desde el cliente y delega
 *              el registro de la solicitud al Server Action `registrarSolicitud`.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Lee el `FormData` del request (`req.formData()`).
 * 2) Llama `registrarSolicitud(formData)` para construir el `FormData` final (si hiciera falta)
 *    y enviarlo al backend (`/functionality/administradores-negocio/`).
 * 3) Si `resp.ok` es `false`, retorna JSON con el mensaje de error y el status del backend.
 * 4) Si todo salió bien, retorna `{ ok: true, data }`.
 * 5) Cualquier excepción no controlada retorna 500 con mensaje genérico.
 *
 * Notas:
 * - Esta ruta actúa como puente entre el front (form submit) y la acción del servidor.
 * - No modifica el cuerpo del `FormData` recibido; pasa tal cual a `registrarSolicitud`.
 */

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
