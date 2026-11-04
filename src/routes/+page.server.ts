import { today } from '#lib/dates.ts';
import { episodeActions } from '#lib/server/episode-actions.ts';
import { services, watchlistRows } from '#lib/server/watchlist.ts';
import { watchlistActions } from '#lib/server/watchlist-actions.ts';
import { KINDS } from '#lib/titles.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const [rows, ours] = await Promise.all([watchlistRows(locals.db), services(locals.db)]);
	const kind = KINDS.find((k) => k === url.searchParams.get('kind')) ?? null;
	const mine = url.searchParams.get('mine') === '1';
	const items = rows.map((r) => ({
		kind: r.kind,
		id: r.tmdbId,
		name: r.name,
		years: r.years,
		poster: r.poster,
		// Ours that show it, most popular first.
		on: ours.filter((s) => r.watchableOn.includes(s.id))
	}));
	const day = today();
	// Shows with an episode out that's next to watch, latest watched first.
	const upNext = rows
		.filter((r) => r.nextSeason && r.nextEpisode && r.nextAirDate && r.nextAirDate <= day)
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
		upNext,
		kind,
		mine,
		total: items.length,
		hasServices: ours.length > 0,
		items: items.filter((t) => (!kind || t.kind === kind) && (!mine || t.on.length))
	};
};

export const actions: Actions = { ...watchlistActions, ...episodeActions };
