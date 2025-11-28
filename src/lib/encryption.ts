import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Chave mestra do servidor - DEVE estar no .env
function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY não está configurada no ambiente');
  }
  // A chave deve ter 32 bytes (256 bits) para AES-256
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Gera uma chave de criptografia única para um casal
 * Esta chave será armazenada criptografada no banco
 */
export function generateCoupleEncryptionKey(): string {
  const coupleKey = crypto.randomBytes(32);
  return encryptWithMasterKey(coupleKey.toString('base64'));
}

/**
 * Garante que um casal tenha uma chave de criptografia.
 * Se não tiver, gera uma nova e salva no banco.
 * Retorna a chave de criptografia do casal.
 */
export async function ensureCoupleEncryptionKey(coupleId: string, existingKey: string | null): Promise<string> {
  if (existingKey) {
    return existingKey;
  }

  // Gera nova chave para casal legado
  const newKey = generateCoupleEncryptionKey();
  
  await prisma.couple.update({
    where: { id: coupleId },
    data: { encryptionKey: newKey },
  });

  return newKey;
}

/**
 * Criptografa a chave do casal com a chave mestra do servidor
 */
function encryptWithMasterKey(data: string): string {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Formato: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Descriptografa a chave do casal usando a chave mestra
 */
function decryptWithMasterKey(encryptedData: string): string {
  const masterKey = getMasterKey();
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Formato de dados criptografados inválido');
  }
  
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Obtém a chave de criptografia do casal (descriptografada)
 */
function getCoupleKey(encryptedCoupleKey: string): Buffer {
  const coupleKeyBase64 = decryptWithMasterKey(encryptedCoupleKey);
  return Buffer.from(coupleKeyBase64, 'base64');
}

/**
 * Criptografa o conteúdo da nota usando a chave do casal
 */
export function encryptNote(content: string, encryptedCoupleKey: string): string {
  if (!content) return '';
  
  const coupleKey = getCoupleKey(encryptedCoupleKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, coupleKey, iv);
  
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Formato: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Descriptografa o conteúdo da nota usando a chave do casal
 */
export function decryptNote(encryptedContent: string, encryptedCoupleKey: string): string {
  if (!encryptedContent) return '';
  
  try {
    const coupleKey = getCoupleKey(encryptedCoupleKey);
    const parts = encryptedContent.split(':');
    
    if (parts.length !== 3) {
      // Conteúdo não está criptografado (legado)
      return encryptedContent;
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, coupleKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Se falhar a descriptografia, pode ser conteúdo legado não criptografado
    console.warn('Falha ao descriptografar nota, retornando conteúdo original:', error);
    return encryptedContent;
  }
}

/**
 * Verifica se um conteúdo está criptografado
 */
export function isEncrypted(content: string): boolean {
  if (!content) return false;
  const parts = content.split(':');
  return parts.length === 3;
}

