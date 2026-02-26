const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}
