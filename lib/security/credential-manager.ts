import crypto from "crypto"
import { createHash } from "crypto"

// Constants for encryption
const ENCRYPTION_ALGORITHM = "aes-256-gcm"
const HASH_ALGORITHM = "sha256"
const PBKDF2_ITERATIONS = 10000
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 16 bytes
const AUTH_TAG_LENGTH = 16 // 16 bytes

export interface EncryptedData {
  iv: string // Initialization vector
  encryptedData: string // Encrypted data
  authTag: string // Authentication tag
  salt: string // Salt used for key derivation
}

export class CredentialManager {
  private encryptionKey: Buffer

  constructor(masterKey: string = process.env.ENCRYPTION_MASTER_KEY || "") {
    if (!masterKey) {
      throw new Error("Encryption master key is required")
    }
    // Create a fixed-length key from the master key
    this.encryptionKey = createHash("sha256").update(masterKey).digest()
  }

  /**
   * Hash a value using SHA-256 with salt
   * This is a one-way hash, cannot be reversed
   */
  static hashValue(value: string): string {
    const salt = crypto.randomBytes(16).toString("hex")
    const hash = crypto
      .createHash(HASH_ALGORITHM)
      .update(salt + value)
      .digest("hex")
    return `${salt}:${hash}`
  }

  /**
   * Verify a value against a hash
   */
  static verifyHash(value: string, hashWithSalt: string): boolean {
    const [salt, storedHash] = hashWithSalt.split(":")
    const computedHash = crypto
      .createHash(HASH_ALGORITHM)
      .update(salt + value)
      .digest("hex")
    return storedHash === computedHash
  }

  /**
   * Encrypt a value using AES-256-GCM
   * This can be decrypted later with the same key
   */
  encryptValue(value: string): EncryptedData {
    // Generate a random salt for key derivation
    const salt = crypto.randomBytes(16)

    // Generate a key using PBKDF2
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512")

    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

    // Encrypt the data
    let encrypted = cipher.update(value, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Get the authentication tag
    const authTag = cipher.getAuthTag()

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
      authTag: authTag.toString("hex"),
      salt: salt.toString("hex"),
    }
  }

  /**
   * Decrypt a value using AES-256-GCM
   */
  decryptValue(encryptedData: EncryptedData): string {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, "hex")
      const authTag = Buffer.from(encryptedData.authTag, "hex")
      const salt = Buffer.from(encryptedData.salt, "hex")

      // Derive the key using the same parameters
      const key = crypto.pbkdf2Sync(this.encryptionKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512")

      // Create decipher
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)

      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encryptedData, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return decrypted
    } catch (error) {
      console.error("Decryption failed:", error)
      throw new Error("Failed to decrypt data")
    }
  }

  /**
   * Generate a secure random API key
   */
  static generateApiKey(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }
}