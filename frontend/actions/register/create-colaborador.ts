'use server' 
import axios from "axios" 

import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function createColaborador(form_data: any) {
  console.log("Vamos por colaborador");
  console.log(form_data);
  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/administradores-negocio/`, form_data, { headers: { Authorization: `Bearer ${token}` } })
  );
  return result && !(result as any).error; // Return true if no error, false otherwise
}