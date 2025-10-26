// actions/login/refresh-token.ts
'use server'

/**
 * Módulo: actions/login/refresh-token
 * Descripción: Server Action para refrescar el token de acceso con el backend y actualizar la sesión.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Realiza POST a `${API_HOST}/seguridad/refresh-token/` con el token actual en `Authorization: Bearer <token>`.
 * 2) Si es exitoso, extrae `access_token`, `refresh_token`, `expires_in`, `token_type`, `scope`, `rol`.
 * 3) Llama `updateSession` para persistir los nuevos valores en la sesión.
 * 4) Devuelve el nuevo `access_token`; en error, registra en consola y retorna `false`.
 *
 * Notas:
 * - Requiere variable de entorno `API_HOST`.
 * - Maneja errores con `axios.isAxiosError` para distinguir errores HTTP.
 */

import axios from 'axios'
import { updateSession } from '@/lib/login/session'

const apiHost = process.env.API_HOST;

export async function refreshToken(token: string) {
    try {
        console.log("Refreshing token...")
        const response = await axios.post(`${apiHost}/seguridad/refresh-token/`,{},{headers: { Authorization: `Bearer ${token}`}})
        const data = response.data
        await updateSession({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
            scope: data.scope,
            role: data.rol
        })
        return data.access_token;
    } catch (error: any) {
        console.error("Error refreshing token:", error)
        if (axios.isAxiosError(error)) {
            return false;
        }
        return false;
    }

}
