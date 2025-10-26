// actions/login/crypto.ts
'use server'

/**
 * Módulo: actions/login/crypto
 * Descripción: Utilidades para cifrar y descifrar cadenas usando AES de CryptoJS.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Detalles:
 * - La clave de cifrado/descifrado se obtiene de la variable de entorno `BASIC_INFO`.
 * - `encryptData(data)`: Cifra el texto en claro y devuelve el string cifrado (base64).
 * - `decryptData(data)`: Descifra el string cifrado (base64) y devuelve el texto en claro (UTF-8).
 *
 * Notas:
 * - Si `BASIC_INFO` no está definida, las funciones lanzan un `Error`.
 * - `console.log` en `encryptData` imprime el dato original antes de cifrar (útil para depuración, evita en producción).
 */

import CryptoJS from 'crypto-js';

const key = process.env.BASIC_INFO;

export async function encryptData(data: string){
  console.log("Encrypting data:", data);
  if (!key) {
    throw new Error("Encryption key is not set in environment variables");
  }
  
  const encrypted = CryptoJS.AES.encrypt(data, key).toString();
  return encrypted;  
}

export async function decryptData(data: string) {
  if (!key) {
    throw new Error("Decryption key is not set in environment variables");
  }

  const decrypted = CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8);
  return decrypted;
}
