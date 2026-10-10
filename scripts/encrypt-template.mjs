#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const crypto = globalThis.crypto || webcrypto;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to display usage
function printHelp() {
  console.log(`
Usage:
  node scripts/encrypt-template.mjs --input <path-to-html> [options]

Options:
  -i, --input <path>     Path to the source HTML file (required)
  -d, --id <docId>       Document ID used in URL query param (defaults to file basename)
  -k, --key <passphrase> Decryption key (defaults to auto-generated 24-character key)
  -t, --title <title>    Human-readable title (defaults to HTML <title> tag or docId)
  -o, --outputDir <dir>  Output directory (defaults to src/content/encrypted)
  -h, --help             Show this help message

Examples:
  # Encrypt a local HTML file with an auto-generated key:
  node scripts/encrypt-template.mjs -i /path/to/my_report.html -d rl202610

  # Encrypt with a custom key:
  node scripts/encrypt-template.mjs -i /path/to/my_report.html -d cardio2026 -k MySecretKey123
`);
}

// Parse command line arguments
function parseArgs(args) {
  const options = {
    input: '',
    id: '',
    key: '',
    title: '',
    outputDir: path.join(projectRoot, 'src', 'content', 'encrypted'),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-i' || arg === '--input') {
      options.input = args[++i];
    } else if (arg === '-d' || arg === '--id') {
      options.id = args[++i];
    } else if (arg === '-k' || arg === '--key') {
      options.key = args[++i];
    } else if (arg === '-t' || arg === '--title') {
      options.title = args[++i];
    } else if (arg === '-o' || arg === '--outputDir') {
      options.outputDir = path.resolve(process.cwd(), args[++i]);
    } else if (!arg.startsWith('-') && !options.input) {
      options.input = arg;
    }
  }

  return options;
}

// Generate random secure key
function generateSecureKey(length = 24) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars[randomBytes[i] % chars.length];
  }
  return key;
}

// Convert bytes to base64
function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// WebCrypto PBKDF2 + AES-GCM
async function encryptContent(content, passphrase, id, title) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
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

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(content)
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

// Extract <title> from HTML
function extractTitleFromHtml(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.input) {
    console.error('❌ Error: Input HTML file path is required.\n');
    printHelp();
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), options.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: File not found at "${inputPath}"`);
    process.exit(1);
  }

  const rawHtml = fs.readFileSync(inputPath, 'utf8');
  if (!rawHtml.trim()) {
    console.error('❌ Error: The input file is empty.');
    process.exit(1);
  }

  // Determine doc ID
  const docId = (options.id || path.basename(inputPath, path.extname(inputPath)))
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  // Determine title
  const title = options.title || extractTitleFromHtml(rawHtml) || docId;

  // Determine key
  const key = options.key || generateSecureKey(24);

  console.log(`🔐 Encrypting "${inputPath}"...`);
  console.log(`   - Document ID: ${docId}`);
  console.log(`   - Title:       ${title}`);
  console.log(`   - Key:         ${key}`);

  const payload = await encryptContent(rawHtml, key, docId, title);

  // Ensure output directory exists
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  // Write TypeScript export file
  const tsContent = `// Auto-generated encrypted template payload for document ID: ${docId}
// Generated at: ${payload.createdAt}
import type { EncryptedTemplatePayload } from '../../types';

export const template: EncryptedTemplatePayload = ${JSON.stringify(payload, null, 2)};

export default template;
`;

  const tsFilePath = path.join(options.outputDir, `${docId}.enc.ts`);
  fs.writeFileSync(tsFilePath, tsContent, 'utf8');

  // Also write raw JSON payload
  const jsonFilePath = path.join(options.outputDir, `${docId}.enc.json`);
  fs.writeFileSync(jsonFilePath, JSON.stringify(payload, null, 2), 'utf8');

  // Update src/content/encrypted/index.ts
  updateIndexTs(options.outputDir);

  console.log(`\n✅ Successfully encrypted template!`);
  console.log(`📁 Saved encrypted files into repo:`);
  console.log(`   - ${path.relative(projectRoot, tsFilePath)}`);
  console.log(`   - ${path.relative(projectRoot, jsonFilePath)}`);
  console.log(`   - ${path.relative(projectRoot, path.join(options.outputDir, 'index.ts'))}`);

  console.log(`\n🔗 Shareable URLs for your users:`);
  console.log(`   - Query param format: ?template=${docId}#key=${encodeURIComponent(key)}`);
  console.log(`   - Direct shorthand:   ?${docId}#key=${encodeURIComponent(key)}`);
  console.log(`\n💡 How it works:`);
  console.log(`   1. The browser reads '#key=...' from the URL fragment.`);
  console.log(`   2. The key is saved to browser localStorage for document '${docId}'.`);
  console.log(`   3. The fragment is stripped from the URL bar (preventing accidental sharing/leakage).`);
  console.log(`   4. Subsequent visits with just ?template=${docId} will automatically unlock using localStorage!`);
}

function updateIndexTs(outputDir) {
  const encFiles = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.enc.ts'))
    .sort();

  const imports = [];
  const entries = [];

  for (let i = 0; i < encFiles.length; i++) {
    const file = encFiles[i];
    const baseName = file.replace(/\.enc\.ts$/, '');
    const varName = `template_${i}_${baseName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    imports.push(`import ${varName} from './${baseName}.enc';`);
    entries.push(`  '${baseName}': ${varName},`);
  }

  const indexContent = `// Auto-generated index of encrypted templates
// Do not edit manually - updated by scripts/encrypt-template.mjs
import type { EncryptedTemplatePayload } from '../../types';

${imports.join('\n')}

export const encryptedTemplates: Record<string, EncryptedTemplatePayload> = {
${entries.join('\n')}
};

export function getEncryptedTemplate(id: string): EncryptedTemplatePayload | undefined {
  return encryptedTemplates[id];
}
`;

  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent, 'utf8');
}


main().catch((err) => {
  console.error('❌ Encryption failed:', err);
  process.exit(1);
});
