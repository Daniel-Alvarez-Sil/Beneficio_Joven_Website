'use server'

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
