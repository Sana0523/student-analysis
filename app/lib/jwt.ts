import { jwtVerify, JWTPayload } from 'jose';

// Define the interface for your expected payload
// This should match what you put into the token when you create it (e.g., on login)
interface CustomJwtPayload extends JWTPayload {
  id: string; // Or 'sub', 'username', etc., whatever you use to identify the user
  // Add other properties you might have included in the token
}

/**
 * Verifies the JWT token and returns its payload.
 * @param token The JWT token string.
 * @returns The payload of the token if valid, otherwise null.
 */
export function verifyJwt(token: string): CustomJwtPayload | null {
  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set.');
    // In a real app, you should throw an error or handle this securely
    return null;
  }

  try {
    // We are verifying the token synchronously here.
    // For serverless environments, async is preferred,
    // but this simplifies the 'verifyJwt' function signature.
    // Let's stick to the async/await pattern for best practice.
    
    // NOTE: This function can't be async if your route.ts
    // calls it synchronously like `const payload = verifyJwt(token);`.
    
    // Let's adjust this to be synchronous to match the code you have.
    // **Correction**: `jose`'s `jwtVerify` is *always* async.
    // This means we must update your API route to `await` it.
    // This is the correct, modern way.

    // **This file (jwt.ts) should be:**
    console.error("This `verifyJwt` function should be async. Please see the correct implementation.");
    return null; // This synchronous version is incorrect with 'jose'

  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}