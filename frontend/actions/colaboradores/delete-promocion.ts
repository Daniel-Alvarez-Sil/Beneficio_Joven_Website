'use server'

import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function deletePromocion(id: number) {
  console.log("Borrando promoción");

  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/promociones/delete/`, {id_promocion: id}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );

  return result && !(result as any).error; // Return true if no error, false otherwise
}