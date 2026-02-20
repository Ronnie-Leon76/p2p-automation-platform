/**
 * Encryption utilities for sensitive data like API credentials
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET || 'fallback-key-for-dev';

// Simple encryption using built-in crypto (replace with more robust solution for production)
export const encrypt = (text: string): string => {
  try {
    // In production, use a proper encryption library like node-forge or crypto-js
    // For now, using base64 encoding as placeholder (NOT SECURE - replace in production)
    const buffer = Buffer.from(text, 'utf8');
    return buffer.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to unencrypted in case of error
  }
};

export const decrypt = (encryptedText: string): string => {
  try {
    // In production, use proper decryption
    // For now, using base64 decoding as placeholder (NOT SECURE - replace in production)
    const buffer = Buffer.from(encryptedText, 'base64');
    return buffer.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Fallback to encrypted text in case of error
  }
};

// TODO: Replace with proper AES encryption for production
// Example implementation with crypto-js:
/*
import CryptoJS from 'crypto-js';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
*/
