// Episode tracking, shared by the household: each episode is watched or not.
// Each show's next episode is worked out here and copied to its watchlist row,
// so Up next loads without calling TMDB.
import { and, eq, sql } from 'drizzle-orm';
import { episodeWatch, watchlist } from './db/schema.ts';
import type { DB } from './db/index.ts';
import type { Tmdb } from './tmdb.ts';
import { addToWatchlist } from './watchlist.ts';
import type { Season, Title } from '../titles.ts';

export type EpisodeRef = { season: number; episode: number };

/** A show's watched episodes. */
export function watchedEpisodes(db: DB, showId: number): Promise<EpisodeRef[]> {
	return db
		.select({ season: episodeWatch.season, episode: episodeWatch.episode })
		.from(episodeWatch)
		.where(eq(episodeWatch.showId, showId));
}

/**
 * The episode after the latest one watched: the next in its season, else the
 * first of the next season. Null before any are watched, or when caught up.
 * Gaps before the latest are left alone (someone may have started midway).
 */
export function nextAfter(seasons: Season[], watched: EpisodeRef[]): EpisodeRef | null {
	if (!watched.length) return null;
	const latest = watched.reduce((a, b) =>
		b.season > a.season || (b.season === a.season && b.episode > a.episode) ? b : a
	);
	const current = seasons.find((s) => s.number === latest.season);
	if (current && latest.episode < current.episodes)
		return { season: latest.season, episode: latest.episode + 1 };
	const following = seasons.find((s) => s.number > latest.season);
	return following ? { season: following.number, episode: 1 } : null;
}

/**
 * Marks episodes watched in one statement, however many: they go in as one JSON
 * value (D1 takes at most 100 bound values, and 50 queries a request).
 */
async function tick(db: DB, showId: number, episodes: EpisodeRef[], userId: number, at: string) {
	await db.run(sql`
		INSERT INTO episode_watch (show_id, season, episode, watched_by, watched_at)
		SELECT ${showId}, json_extract(value, '$.season'), json_extract(value, '$.episode'), ${userId}, ${at}
		FROM json_each(${JSON.stringify(episodes)}) WHERE true
		ON CONFLICT DO NOTHING`);
}

/** Marks episodes of one season watched, or not. */
export async function setWatched(
	db: DB,
	showId: number,
	season: number,
	episodes: number[],
	watched: boolean,
	userId: number,
	now = new Date()
) {
	if (watched)
		return tick(
			db,
			showId,
			episodes.map((episode) => ({ season, episode })),
			userId,
			now.toISOString()
		);
	await db
		.delete(episodeWatch)
		.where(
			and(
				eq(episodeWatch.showId, showId),
				eq(episodeWatch.season, season),
				sql`${episodeWatch.episode} IN (SELECT value FROM json_each(${JSON.stringify(episodes)}))`
			)
		);
}

/** Every episode out so far, from the show's seasons and its latest episode. */
export function airedEpisodes(show: Title): EpisodeRef[] {
	const latest = show.latest;
	if (!latest) return [];
	return show.seasons
		.filter((s) => s.number <= latest.season)
		.flatMap((s) =>
			Array.from({ length: s.number === latest.season ? latest.number : s.episodes }, (_, i) => ({
				season: s.number,
				episode: i + 1
			}))
		);
}

/** Marks the whole show watched (what's out of it), putting it on the list. */
export async function watchAll(db: DB, tmdb: Tmdb, show: Title, userId: number, now = new Date()) {
	await tick(db, show.id, airedEpisodes(show), userId, now.toISOString());
	return updateProgress(db, tmdb, show, { tickedBy: userId, now });
}

/**
 * Works out a show's next episode and copies it to its watchlist row.
 * `tickedBy`: someone just ticked an episode, so the show goes on the watchlist if it
 * isn't there (watching it means it's ours) and Up next puts it first.
 * Returns the next episode, if there is one.
 */
export async function updateProgress(
	db: DB,
	tmdb: Tmdb,
	show: Title,
	{ tickedBy, now = new Date() }: { tickedBy?: number; now?: Date } = {}
) {
	const watched = await watchedEpisodes(db, show.id);
	const next = nextAfter(show.seasons, watched);
	const episode = next
		? ((await tmdb.season(show.id, next.season))?.find((e) => e.number === next.episode) ?? null)
		: null;
	if (tickedBy !== undefined) await addToWatchlist(db, show, tickedBy, now);
	// Just ticked: latest first in Up next. Unticked them all: not being watched (nor seen).
	const watchedAt = tickedBy !== undefined ? now.toISOString() : watched.length ? undefined : null;
	await db
		.update(watchlist)
		.set({
			nextSeason: episode?.season ?? null,
			nextEpisode: episode?.number ?? null,
			nextName: episode?.name ?? null,
			nextAirDate: episode?.airDate ?? null,
			nextStill: episode?.still ?? null,
			...(watchedAt !== undefined && { watchedAt })
		})
		.where(and(eq(watchlist.kind, 'tv'), eq(watchlist.tmdbId, show.id)));
	return episode;
}
