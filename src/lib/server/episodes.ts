// Episode tracking, shared by the household: each episode is watched or not.
// Each show's next episode is worked out here and copied to its watchlist row,
// so Up next loads without calling TMDB.
import { and, eq, or } from 'drizzle-orm';
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

/** Marks episodes watched, or not. */
export async function setWatched(
	db: DB,
	showId: number,
	episodes: EpisodeRef[],
	watched: boolean,
	userId: number,
	now = new Date()
) {
	if (!episodes.length) return;
	if (watched) {
		const at = now.toISOString();
		await db
			.insert(episodeWatch)
			.values(episodes.map((e) => ({ showId, ...e, watchedBy: userId, watchedAt: at })))
			.onConflictDoNothing();
	} else {
		// A season at most: well under D1's 100 bound values.
		await db
			.delete(episodeWatch)
			.where(
				and(
					eq(episodeWatch.showId, showId),
					or(
						...episodes.map((e) =>
							and(eq(episodeWatch.season, e.season), eq(episodeWatch.episode, e.episode))
						)
					)
				)
			);
	}
}

/**
 * Works out a show's next episode and copies it to its watchlist row.
 * `ticked`: an episode was just ticked, so the show goes on the watchlist if it
 * isn't there (watching it means it's ours) and Up next puts it first.
 * Returns the next episode, if there is one.
 */
export async function updateProgress(
	db: DB,
	tmdb: Tmdb,
	show: Title,
	userId: number,
	{ ticked = false, now = new Date() } = {}
) {
	const watched = await watchedEpisodes(db, show.id);
	const next = nextAfter(show.seasons, watched);
	const episode = next
		? ((await tmdb.season(show.id, next.season))?.find((e) => e.number === next.episode) ?? null)
		: null;
	if (ticked) await addToWatchlist(db, show, userId, now);
	await db
		.update(watchlist)
		.set({
			nextSeason: episode?.season ?? null,
			nextEpisode: episode?.number ?? null,
			nextName: episode?.name ?? null,
			nextAirDate: episode?.airDate ?? null,
			nextStill: episode?.still ?? null,
			...(ticked && { watchedAt: now.toISOString() })
		})
		.where(and(eq(watchlist.kind, 'tv'), eq(watchlist.tmdbId, show.id)));
	return episode;
}
