import type { EncryptedTemplatePayload } from '../types';

const STORAGE_KEY_PREFIX = 'template_key_';

/**
 * Convert a Uint8Array to a Base64-encoded string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a Base64-encoded string to a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an AES-GCM 256-bit CryptoKey from a passphrase and salt using PBKDF2.
 */
async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt HTML text using AES-GCM-256 and PBKDF2.
 */
export async function encryptHtml(
  html: string,
  key: string,
  id: string,
  title?: string
): Promise<EncryptedTemplatePayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const aesKey = await deriveAesKey(key, salt, iterations);
  const encodedData = new TextEncoder().encode(html);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    aesKey,
    encodedData
  );

  return {
    id,
    title,
    version: 1,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decrypt an EncryptedTemplatePayload using the given key.
 * Throws an error if the key is invalid or data has been corrupted.
 */
export async function decryptTemplate(
  payload: EncryptedTemplatePayload,
  key: string
): Promise<string> {
  try {
    const salt = base64ToUint8Array(payload.salt);
    const iv = base64ToUint8Array(payload.iv);
    const ciphertext = base64ToUint8Array(payload.ciphertext);

    const aesKey = await deriveAesKey(key, salt, payload.iterations || 100000);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      aesKey,
      ciphertext as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('Invalid decryption key or corrupted data.');
  }
}

/**
 * Retrieve a previously saved decryption key from localStorage for a specific document.
 */
export function getStoredDecryptionKey(docId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${docId}`);
  } catch {
    return null;
  }
}

/**
 * Store the decryption key for a specific document in localStorage.
 */
export function storeDecryptionKey(docId: string, key: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${docId}`, key);
  } catch (err) {
    console.warn('Unable to save decryption key to localStorage:', err);
  }
}

/**
 * Remove the stored decryption key for a specific document from localStorage.
 */
export function removeStoredDecryptionKey(docId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${docId}`);
  } catch {
    // Ignore error
  }
}

/**
 * Parse decryption key from URL hash fragment.
 * Supports:
 *   #key=myKey
 *   #k=myKey
 *   #myKey
 */
export function parseKeyFromHash(hashString: string): string | null {
  if (!hashString) return null;
  const cleaned = hashString.startsWith('#') ? hashString.slice(1) : hashString;
  if (!cleaned.trim()) return null;

  if (cleaned.startsWith('key=')) {
    return decodeURIComponent(cleaned.slice(4));
  }
  if (cleaned.startsWith('k=')) {
    return decodeURIComponent(cleaned.slice(2));
  }
  return decodeURIComponent(cleaned);
}

/**
 * Remove the hash fragment from the browser URL without page reload.
 */
export function cleanHashFromUrl(): void {
  try {
    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
  } catch {
    // Ignore if not supported in test environment
  }
}
