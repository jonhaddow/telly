import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
