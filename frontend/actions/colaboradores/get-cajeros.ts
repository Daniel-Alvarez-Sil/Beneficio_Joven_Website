// /actions/colaboradores/get-cajeros.ts
'use server';

import axios from 'axios';
import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export type Cajero = {
  id: number;
  correo: string;
  telefono: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  contrasena: string;    // ⚠️ llega del backend; NO la muestres en UI
  id_negocio: number;
};

export async function getCajeros(): Promise<Cajero[]> {
  console.log("Fetching cajeros...");
  const res = await withAuthRetry((token: string) =>
    axios.get(`${apiHost}/functionality/cajeros/list/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  console.log("Cajeros fetched:", res);
  // Si tu wrapper devuelve AxiosResponse, usamos .data; si ya regresa data, cae en el segundo return.
  if ((res as any)?.data) return (res as any).data as Cajero[];
  return (res as any) as Cajero[];
}
