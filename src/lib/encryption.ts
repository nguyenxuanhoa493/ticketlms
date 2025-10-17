import crypto from 'crypto';

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Ensure key is 32 bytes
const getKey = () => {
    const key = Buffer.from(ENCRYPTION_KEY);
    if (key.length !== 32) {
        // Pad or truncate to 32 bytes
        return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    }
    return key;
};

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
    if (!text) return text;
    
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Return IV + encrypted data
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(text: string): string {
    if (!text) return text;
    
    try {
        const parts = text.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash password (one-way, for comparison)
 */
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(text: string, visibleChars: number = 4): string {
    if (!text || text.length <= visibleChars) return '****';
    return text.substring(0, visibleChars) + '*'.repeat(Math.max(4, text.length - visibleChars));
}
