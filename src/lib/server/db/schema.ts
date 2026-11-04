import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { KINDS } from '../../titles.ts';

// Days are UK dates as YYYY-MM-DD text; times are ISO timestamps.

/** People who can sign in (Google accounts). */
export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name').notNull()
});

export type User = typeof user.$inferSelect;

/** Signed-in sessions. The id is the SHA-256 of the cookie's token, never the token itself. */
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: text('expires_at').notNull()
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

/** Devices that asked for push notifications (one row per browser/phone). */
export const pushSubscription = sqliteTable('push_subscription', {
	endpoint: text('endpoint').primaryKey(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	userId: integer('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: text('created_at').notNull()
});

/**
 * IMDb, Rotten Tomatoes and Metacritic scores from OMDb, by IMDb id. Kept for a
 * week, so a title's page doesn't use one of the free key's 1,000 daily lookups
 * each time it opens.
 */
export const rating = sqliteTable('rating', {
	imdbId: text('imdb_id').primaryKey(),
	/** Out of 10, e.g. 8.7. */
	imdb: real('imdb'),
	imdbVotes: integer('imdb_votes'),
	/** Percent. */
	rottenTomatoes: integer('rotten_tomatoes'),
	/** Out of 100. */
	metacritic: integer('metacritic'),
	fetchedAt: text('fetched_at').notNull()
});

export type Rating = typeof rating.$inferSelect;

/** The streaming services the household has (TMDB's provider ids). */
export const service = sqliteTable('service', {
	providerId: integer('provider_id').primaryKey(),
	name: text('name').notNull(),
	logo: text('logo'),
	sortOrder: integer('sort_order').notNull().default(0)
});

/**
 * Films and shows the household wants to watch: one shared list. Name, poster
 * and where to watch are copied from TMDB, so the list loads without calling it;
 * where to watch is refreshed whenever the title's page opens.
 */
export const watchlist = sqliteTable(
	'watchlist',
	{
		kind: text('kind', { enum: KINDS }).notNull(),
		tmdbId: integer('tmdb_id').notNull(),
		name: text('name').notNull(),
		years: text('years'),
		poster: text('poster'),
		/** Ids of the services showing it at no extra cost (JSON array). */
		watchableOn: text('watchable_on', { mode: 'json' }).$type<number[]>().notNull(),
		addedBy: integer('added_by').references(() => user.id, { onDelete: 'set null' }),
		addedAt: text('added_at').notNull()
	},
	(t) => [primaryKey({ columns: [t.kind, t.tmdbId] }), index('watchlist_added_idx').on(t.addedAt)]
);

export type WatchlistRow = typeof watchlist.$inferSelect;
