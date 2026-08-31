import { invalidateOverview } from './useOverview';
import { invalidateCollections } from './useCollections';

/**
 * Call this after ANY entry mutation — add, edit, toggle, delete, migrate,
 * reorder. Every one of those can change a number shown somewhere else in
 * the app: the Index page's per-log totals, the Review badge, and — the bug
 * this fixes — a collection's own open/total counts, which are computed live
 * on the server from its entries but were only ever refreshed on the client
 * when a *collection* itself was created, renamed, or deleted. Deleting an
 * entry that happened to live in a collection left that collection's cached
 * count stale everywhere it's shown (the collections list, the sidebar) until
 * some unrelated collection action happened to refresh it.
 *
 * Rather than have every call site remember "this mutation might touch a
 * collection, so invalidate that cache too," every entry mutation invalidates
 * both caches unconditionally through this one function. The extra
 * collections re-fetch is cheap — small payload, deduped against any fetch
 * already in flight — and correctness no longer depends on tracing whether a
 * particular action happens to involve a collection.
 */
export function invalidateJournalCaches() {
  invalidateOverview();
  invalidateCollections();
}
