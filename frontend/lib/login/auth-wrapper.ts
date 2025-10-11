// utils/with-auth-retry.ts
'use server'

import { verifySession } from '@/lib/login/dal';
import { refreshToken } from '@/actions/login/refresh-token';

/**
 * Executes an authenticated API call with automatic retry if token is expired/missing.
 * @param apiCall A function that receives a token and returns a Promise of an Axios response
 * @returns The data of the successful response, or an error object
 */
export async function withAuthRetry<T>(apiCall: (token: string) => Promise<{ data: T }>): Promise<T | { error: string }> {
  let token: string | null = null;
  const session = await verifySession();
  token = session?.token || null;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (!token) {
      return { error: "Session is invalid or expired" };
    }

    try {
      const response = await apiCall(token);
      return response.data;
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      const isAuthError =
        error.response?.status === 401 &&
        (detail === "Authentication credentials were not provided." ||
         detail === "Invalid token." ||
         detail === "Token has expired.");

      if (!isAuthError || attempt === 1) {
        console.error("API error:", error);
        return { error: "Request failed" };
      }

      // Try to refresh the token
      const newToken = await refreshToken(token);
      if (!newToken) {
        return { error: "Token refresh failed" };
      }

      token = newToken;
    }
  }

  return { error: "Unexpected retry failure" };
}
