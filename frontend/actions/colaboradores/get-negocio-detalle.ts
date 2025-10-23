'use server'
import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function getNegocioDetalle() {
  console.log("Vamos por negocio detalle");
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/negocio/detalle/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  // ✅ Return the actual response data, not just a boolean
  if (!result || (result as any).error) {
    throw new Error("Error fetching negocio detalle");
  }

  console.log("Negocio detalle result:", result);
  return result;
}
