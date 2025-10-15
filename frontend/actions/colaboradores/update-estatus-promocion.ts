'use server'

import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function cambiarEstatusPromocion(id: number) {
  console.log("Cambio de estatus de promocion");

  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/promociones/update/`, {id_promocion: id}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );

  return result && !(result as any).error; // Return true if no error, false otherwise
}