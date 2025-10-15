'use server'

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function getResumenNegocios() {
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/negocios/resumen/`, {
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