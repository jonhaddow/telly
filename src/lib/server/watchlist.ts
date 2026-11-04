import { and, desc, eq } from 'drizzle-orm';
import { service, watchlist } from './db/schema.ts';
import type { DB } from './db/index.ts';
import { watchableOn, type Kind, type Provider, type Title } from '../titles.ts';

const key = (kind: Kind, id: number) => and(eq(watchlist.kind, kind), eq(watchlist.tmdbId, id));

/** The shared watchlist, newest first. */
export function watchlistRows(db: DB) {
	return db.select().from(watchlist).orderBy(desc(watchlist.addedAt));
}

/** Everything on the watchlist, as `kind-id` keys. */
export async function onWatchlist(db: DB): Promise<Set<string>> {
	const rows = await db.select({ kind: watchlist.kind, id: watchlist.tmdbId }).from(watchlist);
	return new Set(rows.map((r) => `${r.kind}-${r.id}`));
}

export async function addToWatchlist(db: DB, t: Title, userId: number, now = new Date()) {
	await db
		.insert(watchlist)
		.values({
			kind: t.kind,
			tmdbId: t.id,
			name: t.name,
			years: t.years,
			poster: t.poster,
			watchableOn: watchableOn(t.providers),
			addedBy: userId,
			addedAt: now.toISOString()
		})
		.onConflictDoNothing();
}

export async function removeFromWatchlist(db: DB, kind: Kind, id: number) {
	await db.delete(watchlist).where(key(kind, id));
}

/** Keeps a listed title's copy of TMDB's details current. Returns whether it's listed. */
export async function refreshListed(db: DB, t: Title) {
	const updated = await db
		.update(watchlist)
		.set({ name: t.name, years: t.years, poster: t.poster, watchableOn: watchableOn(t.providers) })
		.where(key(t.kind, t.id))
		.returning({ id: watchlist.tmdbId });
	return updated.length > 0;
}

/** The household's services, most popular first (as TMDB had them when chosen). */
export function services(db: DB): Promise<Provider[]> {
	return db
		.select({ id: service.providerId, name: service.name, logo: service.logo })
		.from(service)
		.orderBy(service.sortOrder);
}

/** Replaces the household's services; give them most popular first. */
export async function setServices(db: DB, chosen: Provider[]) {
	const rows = chosen.map((p, i) => ({
		providerId: p.id,
		name: p.name,
		logo: p.logo,
		sortOrder: i
	}));
	await db.batch([db.delete(service), ...(rows.length ? [db.insert(service).values(rows)] : [])]);
}
