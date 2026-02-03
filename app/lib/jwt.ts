/**
 * JWT Utilities
 * =============
 * Addresses audit finding: "verifyJwt Function is Broken"
 * 
 * Uses 'jose' library for modern JWT verification.
 */

import { jwtVerify, SignJWT, JWTPayload } from 'jose';

// Define the interface for your expected payload
export interface CustomJwtPayload extends JWTPayload {
  id: number;
  email: string;
  role: 'teacher' | 'student';
}

// Get the secret key - must match what's used in login
const getSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET_KEY || 'my-super-secret-key-for-development';
  return new TextEncoder().encode(secret);
};

/**
 * Verifies a JWT token and returns its payload.
 * @param token The JWT token string.
 * @returns The payload of the token if valid, otherwise null.
 */
export async function verifyJwt(token: string): Promise<CustomJwtPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as CustomJwtPayload;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Creates a new JWT token (for use in login route if migrating from jsonwebtoken)
 * @param payload The data to encode in the token
 * @returns The signed JWT token
 */
export async function createJwt(payload: Omit<CustomJwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecretKey());
}

/**
 * Extracts the token from an Authorization header
 * @param authHeader The Authorization header value
 * @returns The token string or null
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}
