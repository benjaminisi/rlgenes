import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const crypto = globalThis.crypto || webcrypto;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(passphrase, salt, iterations = 100000) {
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
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptHtml(html, key, id, title) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const aesKey = await deriveAesKey(key, salt, iterations);
  const encodedData = new TextEncoder().encode(html);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
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

async function decryptTemplate(payload, key) {
  try {
    const salt = base64ToUint8Array(payload.salt);
    const iv = base64ToUint8Array(payload.iv);
    const ciphertext = base64ToUint8Array(payload.ciphertext);

    const aesKey = await deriveAesKey(key, salt, payload.iterations || 100000);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('Invalid decryption key or corrupted data.');
  }
}

function parseKeyFromHash(hashString) {
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

test('parseKeyFromHash correctly extracts key from different fragment formats', () => {
  assert.equal(parseKeyFromHash('#key=mySecret123'), 'mySecret123');
  assert.equal(parseKeyFromHash('#k=mySecret123'), 'mySecret123');
  assert.equal(parseKeyFromHash('#mySecret123'), 'mySecret123');
  assert.equal(parseKeyFromHash('#key=hello%20world'), 'hello world');
  assert.equal(parseKeyFromHash(''), null);
  assert.equal(parseKeyFromHash('#'), null);
});

test('encryptHtml and decryptTemplate round-trip successfully', async () => {
  const originalHtml = '<html><body><h1>Secret Report</h1><p>Data</p></body></html>';
  const secretKey = 'super-strong-passphrase-2026';
  const docId = 'test-doc-1';

  const payload = await encryptHtml(originalHtml, secretKey, docId, 'Secret Report');

  assert.equal(payload.id, docId);
  assert.equal(payload.title, 'Secret Report');
  assert.equal(payload.algorithm, 'AES-GCM-256');
  assert.ok(payload.ciphertext.length > 0);
  assert.notEqual(payload.ciphertext, originalHtml);

  // Decrypt with correct key
  const decrypted = await decryptTemplate(payload, secretKey);
  assert.equal(decrypted, originalHtml);

  // Decrypt with wrong key should throw
  await assert.rejects(
    async () => {
      await decryptTemplate(payload, 'wrong-key-456');
    },
    {
      message: 'Invalid decryption key or corrupted data.',
    }
  );
});

test('decrypt generated example_test payload matches public/example_template.html', async () => {
  const jsonPath = path.join(projectRoot, 'src', 'content', 'encrypted', 'example_test.enc.json');
  const originalPath = path.join(projectRoot, 'public', 'example_template.html');

  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const originalHtml = fs.readFileSync(originalPath, 'utf8');

  const decrypted = await decryptTemplate(payload, 'test-secret-key-2026');
  assert.equal(decrypted, originalHtml);
});
