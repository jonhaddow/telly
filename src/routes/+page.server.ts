import { today } from '#lib/dates.ts';
import { apis } from '#lib/server/apis.ts';
import { episodeActions } from '#lib/server/episode-actions.ts';
import { isSeen, nextOut, services, watchlistRows } from '#lib/server/watchlist.ts';
import { watchlistActions } from '#lib/server/watchlist-actions.ts';
import { KINDS } from '#lib/titles.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const [all, ours] = await Promise.all([watchlistRows(locals.db), services(locals.db)]);
	const param = (name: string) => url.searchParams.get(name);
	const seen = param('list') === 'seen';
	const kind = KINDS.find((k) => k === param('kind')) ?? null;
	const mine = !seen && param('mine') === '1';
	const rent = !seen && param('rent') === '1';
	const genre = seen ? null : param('genre');
	// One service, from the counts on Your services: is it worth subscribing to?
	const onId = Number(param('on')) || null;
	// A service that isn't ours needs TMDB for its name. An unknown one isn't a filter.
	const on = onId
		? (ours.find((s) => s.id === onId) ??
			(await (await apis()).tmdb.services()).find((s) => s.id === onId) ??
			null)
		: null;
	const ourIds = new Set(ours.map((s) => s.id));
	const day = today();
	const rows = all.filter((r) => isSeen(r, day) === seen);
	if (seen)
		// Latest seen first.
		rows.sort((a, b) =>
			(b.seenAt ?? b.watchedAt ?? '').localeCompare(a.seenAt ?? a.watchedAt ?? '')
		);
	const items = rows
		.filter(
			(r) =>
				(!kind || r.kind === kind) &&
				(!mine || r.watchableOn.some((id) => ourIds.has(id))) &&
				(!rent || r.toRent) &&
				(!genre || r.genres.includes(genre)) &&
				(!on || r.watchableOn.includes(on.id))
		)
		.map((r) => ({
			kind: r.kind,
			id: r.tmdbId,
			name: r.name,
			years: r.years,
			poster: r.poster,
			// Ours that show it, most popular first.
			on: ours.filter((s) => r.watchableOn.includes(s.id))
		}));
	// Shows with an episode out that's next to watch, latest watched first (none seen).
	const upNext = rows
		.filter((r) => r.nextEpisode && nextOut(r, day))
		.sort((a, b) => (b.watchedAt ?? '').localeCompare(a.watchedAt ?? ''))
		.map((r) => ({
			id: r.tmdbId,
			name: r.name,
			poster: r.poster,
			still: r.nextStill,
			season: r.nextSeason!,
			number: r.nextEpisode!,
			episodeName: r.nextName ?? ''
		}));
	return {
		seen,
		upNext,
		kind,
		mine,
		rent,
		genre,
		genres: seen ? [] : [...new Set(rows.flatMap((r) => r.genres))].sort(),
		on,
		total: rows.length,
		hasServices: ours.length > 0,
		items
	};
};

export const actions: Actions = { ...watchlistActions, ...episodeActions };
