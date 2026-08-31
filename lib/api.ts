import type {
  Collection,
  Entry,
  EntryDraft,
  IndexOverview,
  MigrateTarget,
  Role,
  User,
} from './types';

const BASE = '/api';
const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as any) };
  // Custom header a cross-site form/script can't set — the server requires
  // it on state-changing requests as a CSRF defense.
  if (MUTATING.has(method)) headers['X-Requested-With'] = 'XMLHttpRequest';

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* body was not JSON - keep the generic message */
    }
    // A session that dies mid-use (expiry, or an admin revoking it) should
    // bounce the user back to /login rather than leave a half-broken page up.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bujo:unauthorized'));
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function query(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  me: () => request<User>('/auth/me'),

  register: (data: { email: string; password: string; name: string }) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  deleteMe: (password: string) =>
    request<{ ok: boolean }>('/auth/me', { method: 'DELETE', body: JSON.stringify({ password }) }),

  adminUsers: () => request<User[]>('/admin/users'),

  adminUpdateRole: (id: number, role: Role) =>
    request<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  adminDeleteUser: (id: number) => request<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),

  overview: () => request<IndexOverview>('/index'),

  entries: (params: Record<string, string | number | undefined | null> = {}) =>
    request<Entry[]>(`/entries${query(params)}`),

  createEntry: (draft: EntryDraft) =>
    request<Entry>('/entries', { method: 'POST', body: JSON.stringify(draft) }),

  updateEntry: (id: number, patch: Partial<Entry>) =>
    request<Entry>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  toggleEntry: (id: number) => request<Entry>(`/entries/${id}/toggle`, { method: 'POST' }),

  migrateEntry: (id: number, target: MigrateTarget) =>
    request<{ source: Entry; migrated: Entry }>(`/entries/${id}/migrate`, {
      method: 'POST',
      body: JSON.stringify(target),
    }),

  reorderEntries: (ids: number[]) =>
    request<{ ok: boolean }>('/entries/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  deleteEntry: (id: number) => request<{ ok: boolean }>(`/entries/${id}`, { method: 'DELETE' }),

  collections: () => request<Collection[]>('/collections'),

  collection: (id: number) => request<Collection>(`/collections/${id}`),

  createCollection: (data: Partial<Collection>) =>
    request<Collection>('/collections', { method: 'POST', body: JSON.stringify(data) }),

  updateCollection: (id: number, data: Partial<Collection>) =>
    request<Collection>(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCollection: (id: number) =>
    request<{ ok: boolean }>(`/collections/${id}`, { method: 'DELETE' }),
};
