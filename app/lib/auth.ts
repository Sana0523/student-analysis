/**
 * Authentication Utilities
 * ========================
 * Addresses audit finding: "User Authentication Uses Mock Data"
 * 
 * Provides password hashing and verification using bcryptjs.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password
 * @param password - The plaintext password to hash
 * @returns Promise<string> - The bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - The plaintext password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Synchronous version of hashPassword for migration scripts
 * @param password - The plaintext password to hash
 * @returns string - The bcrypt hash
 */
export function hashPasswordSync(password: string): string {
    return bcrypt.hashSync(password, SALT_ROUNDS);
}
