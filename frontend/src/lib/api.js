const TOKEN_KEY = 'token';

// localStorage can be unavailable (private mode, blocked storage): never throw.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function send(method, path, { body, formData } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(`/api${path}`, { method, headers, body: payload });
  if (!response.ok && response.status === 401 && token && onUnauthorized) onUnauthorized();
  return response;
}

async function request(method, path, options) {
  const response = await send(method, path, options);
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, (data && data.error) || 'Beklenmeyen bir hata oluştu.');
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, { formData }),
};

// Files need the Authorization header, so they are fetched as a blob.
export async function fetchBlob(path) {
  const response = await send('GET', path);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, (data && data.error) || 'Dosya alınamadı.');
  }
  return response.blob();
}
