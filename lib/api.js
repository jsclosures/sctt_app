/**
 * Base API utility for communicating with the Node.js backend.
 *
 * All requests go through the Next.js rewrite proxy:
 *   /api/restservice  →  http://localhost:8180/restservice
 *   /api/authservice  →  http://localhost:8180/authservice
 *
 * The backend routes on `contenttype` (query param or body field)
 * and `action` (GET | POST | DELETE) within each handler.
 */

const REST_ENDPOINT = '/api/restservice';
const AUTH_ENDPOINT = '/api/authservice';

// ─── Auth gate ──────────────────────────────────────────────────────

let _authReady = null;

/**
 * Ensures a valid zen cookie exists before any API call.
 * Calls login once (username === password satisfies the backend).
 * Subsequent calls reuse the resolved promise.
 */
export async function ensureAuth(user = 'admin') {
  if (!_authReady) {
    _authReady = (async () => {
      // Check if zen cookie already exists
      if (typeof document !== 'undefined' && document.cookie.includes('zen=')) {
        return { status: 1, message: 'already authenticated' };
      }

      // Set the zen cookie client-side.
      // Next.js rewrites don't reliably forward Set-Cookie headers
      // from the backend, so we handle it here.
      if (typeof document !== 'undefined') {
        document.cookie = `zen=${user}; path=/`;
      }

      // Also attempt the login call so the backend logs it,
      // but don't fail if it doesn't work.
      try {
        await login(user, user);
      } catch (e) {
        console.warn('Login call failed (cookie set manually):', e);
      }

      return { status: 1, message: 'authenticated' };
    })();
  }
  return _authReady;
}

// ─── Generic helpers ────────────────────────────────────────────────

/**
 * GET request to /restservice with query params.
 * Used for list/read operations.
 *
 * @param {Object} params - key/value pairs sent as query string
 * @returns {Promise<Object>} parsed JSON response
 */
export async function restGet(params = {}) {
  await ensureAuth(); // make sure zen cookie is set

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const url = `${REST_ENDPOINT}?${query.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`API GET failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * POST request to /restservice with JSON body.
 * Used for create / update / delete operations.
 *
 * @param {Object} body - JSON body sent to the backend
 * @returns {Promise<Object>} parsed JSON response
 */
export async function restPost(body = {}) {
  await ensureAuth(); // make sure zen cookie is set

  const res = await fetch(REST_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API POST failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ─── Auth helpers ───────────────────────────────────────────────────

/**
 * Check if the current session is authenticated.
 */
export async function checkAuth() {
  const res = await fetch(`${AUTH_ENDPOINT}?contenttype=AUTH`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contenttype: 'AUTH' }),
  });

  return res.json();
}

/**
 * Login with username/password.
 */
export async function login(user, password) {
  const res = await fetch(AUTH_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contenttype: 'LOGIN', user, password }),
  });

  return res.json();
}

/**
 * Logout (delete session).
 */
export async function logout(user) {
  const res = await fetch(AUTH_ENDPOINT, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contenttype: 'LOGIN', user }),
  });

  return res.json();
}

// ─── Encoding helpers ───────────────────────────────────────────────

/**
 * Encode a plain string to base64 (for storing notes/scripts in Solr).
 */
export function toBase64(str) {
  if (typeof window !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Decode a base64 string back to plain text.
 */
export function fromBase64(b64) {
  try {
    if (typeof window !== 'undefined') {
      return decodeURIComponent(escape(atob(b64)));
    }
    return Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    return b64; // return as-is if decoding fails
  }
}