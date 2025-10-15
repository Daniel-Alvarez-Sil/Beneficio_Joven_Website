'use server'

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function getSolicitudes() {
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/solicitudes-negocio/list/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  if (result && !(result as any).error) {
    return result;
  }

  console.error('Error fetching sales data:', result);
  return false;
}