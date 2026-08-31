import type {
  Collection,
  Entry,
  EntryDraft,
  Folder,
  IndexOverview,
  MigrateTarget,
  Role,
  User,
} from './types';

const BASE = '/api';
const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export class ApiError extends Error {
  status: number;
  /** Stable machine-readable error id (e.g. "email_taken"), when the server
   * sent one — lets the UI show its own localized copy instead of whatever
   * language the raw `error` string happens to be in. Undefined for
   * validation errors, which are already a message meant to be shown as-is. */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
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
    let code: string | undefined;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      if (typeof body?.code === 'string') code = body.code;
    } catch {
      /* body was not JSON - keep the generic message */
    }
    // A session that dies mid-use (expiry, or an admin revoking it) should
    // bounce the user back to /login rather than leave a half-broken page up.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bujo:unauthorized'));
    }
    throw new ApiError(message, res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Turns a caught error into text worth showing a user: a coded ApiError
 * (email_taken, wrong_password, ...) gets the dictionary's localized copy for
 * that code, an uncoded ApiError (validation errors — already a message
 * meant to be read as-is) gets its own message, and anything else — a
 * network failure, a thrown non-Error — gets the generic fallback rather
 * than `String(err)` or a blank error.
 */
export function describeError(err: unknown, errorCodes: Record<string, string>, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code && errorCodes[err.code]) return errorCodes[err.code];
    return err.message || fallback;
  }
  return fallback;
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

  // Open entries from a spread that has already passed — the material for
  // the Review page's daily-reflection / migration ritual.
  dueEntries: () => request<Entry[]>('/entries/review'),

  createEntry: (draft: EntryDraft) =>
    request<Entry>('/entries', { method: 'POST', body: JSON.stringify(draft) }),

  updateEntry: (id: number, patch: Partial<Entry>) =>
    request<Entry>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  toggleEntry: (id: number) => request<Entry>(`/entries/${id}/toggle`, { method: 'POST' }),

  // Moves an entry into a collection folder, or (folderId: null) back to
  // that collection's unsorted area. Separate from updateEntry because a
  // partial-patch's "field omitted" and "field explicitly cleared" collapse
  // to the same nil on the wire — this endpoint's only job is setting the
  // folder, so null is never ambiguous here.
  setEntryFolder: (id: number, folderId: number | null) =>
    request<Entry>(`/entries/${id}/folder`, { method: 'PATCH', body: JSON.stringify({ folderId }) }),

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

  folders: (collectionId: number) => request<Folder[]>(`/collections/${collectionId}/folders`),

  createFolder: (collectionId: number, title: string) =>
    request<Folder>(`/collections/${collectionId}/folders`, { method: 'POST', body: JSON.stringify({ title }) }),

  updateFolder: (id: number, patch: Partial<Pick<Folder, 'title' | 'position'>>) =>
    request<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteFolder: (id: number) => request<{ ok: boolean }>(`/folders/${id}`, { method: 'DELETE' }),
};
