'use server'

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