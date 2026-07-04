import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // tamanho recomendado de IV para GCM

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY não configurada nas variáveis de ambiente");
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY precisa ter 32 bytes (gere com `openssl rand -base64 32`)");
  }
  return buf;
}

/**
 * Criptografa um texto (ex: token de acesso do GitHub) antes de salvar no banco.
 * Formato do resultado: "iv:authTag:ciphertext", tudo em base64.
 */
export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

/**
 * Descriptografa um valor salvo com `encrypt`. Lança erro se o formato for
 * inválido ou se a chave não bater (ex: dado corrompido ou chave errada).
 */
export function decrypt(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato inválido para descriptografar (esperado iv:authTag:ciphertext)");
  }
  const [ivB64, tagB64, dataB64] = parts;

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}