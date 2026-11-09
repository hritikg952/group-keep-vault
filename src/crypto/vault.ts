/**
 * Client-Side Zero-Knowledge Encryption using Web Crypto API (AES-256-GCM + PBKDF2)
 *
 * All sensitive notes, titles, passwords, and lists are encrypted directly inside the browser
 * before they are ever transmitted to Supabase. The server never receives
 * plaintext content or your Group Vault Passphrase.
 */

import { DecryptedNoteContent } from '../types';

// Convert Uint8Array to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random salt (16 bytes)
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

// Derive a 256-bit AES-GCM key from passphrase and salt using PBKDF2
export async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt payload (title, content, checklist) into AES-256-GCM ciphertext
export async function encryptNoteContent(
  payload: DecryptedNoteContent,
  passphrase: string,
  existingSalt?: string
): Promise<{ encryptedPayload: string; iv: string; salt: string }> {
  const salt = existingSalt ? base64ToBuffer(existingSalt) : generateSalt();
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  // 12 bytes IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  return {
    encryptedPayload: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

// Decrypt AES-256-GCM ciphertext back into payload
export async function decryptNoteContent(
  encryptedPayload: string,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<DecryptedNoteContent> {
  try {
    const salt = base64ToBuffer(saltBase64);
    const iv = base64ToBuffer(ivBase64);
    const cipherBuffer = base64ToBuffer(encryptedPayload);

    const key = await deriveKeyFromPassphrase(passphrase, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as DecryptedNoteContent;
  } catch {
    throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
  }
}

// Canary check: generates an encrypted canary token stored locally or in group settings
// to quickly verify if an entered passphrase is valid without decrypting every note.
export async function createVaultCanary(passphrase: string): Promise<{ canaryCipher: string; iv: string; salt: string }> {
  const salt = generateSalt();
  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const checkToken = encoder.encode('GROUP_KEEP_VAULT_VALID');

  const cipher = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    checkToken
  );

  return {
    canaryCipher: bufferToBase64(cipher),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

export async function verifyVaultCanary(
  canaryCipher: string,
  ivBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<boolean> {
  try {
    const salt = base64ToBuffer(saltBase64);
    const iv = base64ToBuffer(ivBase64);
    const cipherBuffer = base64ToBuffer(canaryCipher);
    const key = await deriveKeyFromPassphrase(passphrase, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    const resultText = decoder.decode(decrypted);
    return resultText === 'GROUP_KEEP_VAULT_VALID' || resultText === 'FAMILY_KEEP_VAULT_VALID';
  } catch {
    return false;
  }
}
