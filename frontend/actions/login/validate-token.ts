// actions/login/validate-token.ts
'use server'

/**
 * Módulo: actions/login/validate-token
 * Descripción: Verifica con el backend si un token Bearer es válido.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Realiza un GET a `${API_HOST}/seguridad/validate-token/` enviando el header `Authorization: Bearer <token>`.
 * 2) Si la petición responde sin error → retorna `true`.
 * 3) Si ocurre un error (HTTP/axios), retorna `false`.
 *
 * Notas:
 * - Requiere la variable de entorno `API_HOST`.
 * - No se expone el contenido del token en logs para evitar riesgos.
 */

import axios from 'axios'
const apiHost = process.env.API_HOST;

export async function validateToken(token: string) {

    try {
        const response = await axios.get(`${apiHost}/seguridad/validate-token/`, 
            { headers: { Authorization: `Bearer ${token}` } })
        return true;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            return false;
        }
        return false;
    }
}
