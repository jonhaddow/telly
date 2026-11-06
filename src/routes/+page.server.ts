import { today } from '#lib/dates.ts';
import { episodeActions } from '#lib/server/episode-actions.ts';
import { isSeen, nextOut, services, watchlistRows } from '#lib/server/watchlist.ts';
import { watchlistActions } from '#lib/server/watchlist-actions.ts';
import { KINDS } from '#lib/titles.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const [all, ours] = await Promise.all([watchlistRows(locals.db), services(locals.db)]);
	const seen = url.searchParams.get('list') === 'seen';
	const kind = KINDS.find((k) => k === url.searchParams.get('kind')) ?? null;
	const mine = !seen && url.searchParams.get('mine') === '1';
	const rent = !seen && url.searchParams.get('rent') === '1';
	const day = today();
	const rows = all.filter((r) => isSeen(r, day) === seen);
	if (seen)
		// Latest seen first.
		rows.sort((a, b) =>
			(b.seenAt ?? b.watchedAt ?? '').localeCompare(a.seenAt ?? a.watchedAt ?? '')
		);
	const items = rows.map((r) => ({
		kind: r.kind,
		id: r.tmdbId,
		name: r.name,
		years: r.years,
		poster: r.poster,
		// Ours that show it, most popular first.
		on: ours.filter((s) => r.watchableOn.includes(s.id)),
		toRent: r.toRent
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
		total: items.length,
		hasServices: ours.length > 0,
		items: items.filter(
			(t) => (!kind || t.kind === kind) && (!mine || t.on.length) && (!rent || t.toRent)
		)
	};
};

export const actions: Actions = { ...watchlistActions, ...episodeActions };
