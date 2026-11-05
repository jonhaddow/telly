import { error } from '@sveltejs/kit';
import { today } from '#lib/dates.ts';
import { apis } from '#lib/server/apis.ts';
import { episodeActions } from '#lib/server/episode-actions.ts';
import { updateProgress, watchedEpisodes } from '#lib/server/episodes.ts';
import { ratingsFor } from '#lib/server/omdb.ts';
import { isSeen, refreshListed, services } from '#lib/server/watchlist.ts';
import { watchlistActions } from '#lib/server/watchlist-actions.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { tmdb, omdbKey, fetcher } = await apis();
	const title = await tmdb.title(params.kind, params.id);
	if (!title) error(404, 'Not found');
	const isShow = title.kind === 'tv';
	const [row, ours, watched] = await Promise.all([
		refreshListed(locals.db, title),
		services(locals.db),
		isShow ? watchedEpisodes(locals.db, title.id) : []
	]);
	// A listed show being watched. Caught up, or waiting for an episode: check
	// TMDB for a new season or date. Otherwise the kept next episode will do.
	const kept =
		row?.nextSeason && row.nextEpisode
			? {
					season: row.nextSeason,
					number: row.nextEpisode,
					name: row.nextName ?? '',
					airDate: row.nextAirDate
				}
			: null;
	const waiting = !kept || !kept.airDate || kept.airDate > today();
	const next =
		row && watched.length && waiting ? await updateProgress(locals.db, tmdb, title) : kept;
	return {
		title,
		listed: !!row,
		// With the next episode just worked out, if it was.
		seen:
			!!row &&
			isSeen(
				{ ...row, nextSeason: next?.season ?? null, nextAirDate: next?.airDate ?? null },
				today()
			),
		ours: ours.map((s) => s.id),
		// Watched episodes in each season.
		watchedBySeason: Object.fromEntries(
			title.seasons.map((s) => [s.number, watched.filter((w) => w.season === s.number).length])
		),
		watchedAny: watched.length > 0,
		next,
		// Streamed: the page shows straight away and the scores fill in.
		ratings:
			title.imdbId && omdbKey
				? ratingsFor(locals.db, title.imdbId, omdbKey, fetcher).catch((e: unknown) => {
						console.error('Ratings', e);
						return null;
					})
				: Promise.resolve(null)
	};
};

export const actions: Actions = { ...watchlistActions, ...episodeActions };
