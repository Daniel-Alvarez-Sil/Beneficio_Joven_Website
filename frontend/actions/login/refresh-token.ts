'use server'

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