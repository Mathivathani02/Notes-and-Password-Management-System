const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
/**
 * Derive encryption key from secret/master password and salt
 */
function deriveKey(masterPassword, salt) {
  return crypto.pbkdf2Sync(masterPassword, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}
/**
 * Hash a password with salt for storage and verification
 */
function hashPassword(password, existingSalt = null) {
  const salt = existingSalt ? Buffer.from(existingSalt, 'hex') : crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha256');
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex')
  };
}
/**
 * Verify password against stored hash and salt
 */
function verifyPassword(password, saltHex, expectedHashHex) {
  const { hash } = hashPassword(password, saltHex);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHashHex, 'hex'));
}
/**
 * Encrypt plain text using AES-256-GCM
 */
function encrypt(text, secretKeyHex) {
  if (!text) return '';
  const key = Buffer.from(secretKeyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
/**
 * Decrypt cipher text using AES-256-GCM
 */
function decrypt(cipherPayload, secretKeyHex) {
  if (!cipherPayload) return '';
  try {
    const parts = cipherPayload.split(':');
    if (parts.length !== 3) return cipherPayload; // Fallback if plain text
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = Buffer.from(secretKeyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '***[Decryption Failed]***';
  }
}
/**
 * Generate cryptographically secure random password
 */
function generateRandomPassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;
  const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };
  let validChars = '';
  const guaranteedChars = [];
  if (uppercase) {
    validChars += charSets.uppercase;
    guaranteedChars.push(charSets.uppercase[crypto.randomInt(0, charSets.uppercase.length)]);
  }
  if (lowercase) {
    validChars += charSets.lowercase;
    guaranteedChars.push(charSets.lowercase[crypto.randomInt(0, charSets.lowercase.length)]);
  }
  if (numbers) {
    validChars += charSets.numbers;
    guaranteedChars.push(charSets.numbers[crypto.randomInt(0, charSets.numbers.length)]);
  }
  if (symbols) {
    validChars += charSets.symbols;
    guaranteedChars.push(charSets.symbols[crypto.randomInt(0, charSets.symbols.length)]);
  }
  if (!validChars) {
    validChars = charSets.lowercase + charSets.numbers;
  }
  const remainingLength = Math.max(0, length - guaranteedChars.length);
  const result = [...guaranteedChars];
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = crypto.randomInt(0, validChars.length);
    result.push(validChars[randomIndex]);
  }
  // Shuffle the result array using Fisher-Yates shuffle with crypto.randomInt
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join('');
}
/**
 * Evaluate password strength (0 to 100 score + label)
 */
function evaluateStrength(password) {
  if (!password) return { score: 0, label: 'Empty', color: '#EF4444' };
  let score = 0;
  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  score = Math.min(100, score);
  let label = 'Very Weak';
  let color = '#EF4444'; // Red
  if (score >= 80) {
    label = 'Strong';
    color = '#10B981'; // Green
  } else if (score >= 60) {
    label = 'Moderate';
    color = '#F59E0B'; // Amber
  } else if (score >= 40) {
    label = 'Weak';
    color = '#F97316'; // Orange
  }
  return { score, label, color };
}
module.exports = {
  deriveKey,
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateRandomPassword,
  evaluateStrength
};
