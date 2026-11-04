import { error } from '@sveltejs/kit';
import { apis } from '#lib/server/apis.ts';
import { ratingsFor } from '#lib/server/omdb.ts';
import { refreshListed, services } from '#lib/server/watchlist.ts';
import { watchlistActions } from '#lib/server/watchlist-actions.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { tmdb, omdbKey, fetcher } = await apis();
	const title = await tmdb.title(params.kind, params.id);
	if (!title) error(404, 'Not found');
	const [listed, ours] = await Promise.all([refreshListed(locals.db, title), services(locals.db)]);
	return {
		title,
		listed,
		ours: ours.map((s) => s.id),
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

export const actions: Actions = watchlistActions;
