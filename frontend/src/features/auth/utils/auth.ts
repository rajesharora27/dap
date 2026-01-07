/**
 * Authentication utility functions
 */

interface JWTPayload {
  uid?: string;
  userId?: string;
  username?: string;
  email?: string;
  fullName?: string;
  isAdmin?: boolean;
  role?: string;
  roles?: string[];
  permissions?: any;
  access?: any;
  exp?: number;
  iat?: number;
}

/**
 * Decode a JWT token
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Check if a token is valid (exists and not expired)
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }

  // Check format
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Check expiration
  return !isTokenExpired(token);
}

/**
 * Get user information from token
 */
export function getUserFromToken(token: string): any | null {
  const payload = decodeToken(token);
  if (!payload) {
    return null;
  }

  const roles = Array.isArray(payload.roles) ? payload.roles : [];
  const primaryRole = payload.role || roles[0];

  return {
    id: payload.userId || payload.uid,
    username: payload.username,
    email: payload.email,
    fullName: payload.fullName,
    role: primaryRole, // Back-compat: older tokens may only include role, newer include roles[]
    roles,
    isAdmin: payload.isAdmin || primaryRole === 'ADMIN',
    permissions: payload.permissions,
    access: payload.access
  };
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.clear();
}

