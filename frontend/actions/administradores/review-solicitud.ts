'use server' 
import axios from "axios" 

import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function reviewSolicitud(body: { id_solicitud: number; estatus: boolean; observaciones: string }) {
  console.log("Vamos por solicitudes");
  console.log(body);
  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/solicitudes-negocio/review/`, body, { headers: { Authorization: `Bearer ${token}` } })
  );
  return result && !(result as any).error; // Return true if no error, false otherwise
}