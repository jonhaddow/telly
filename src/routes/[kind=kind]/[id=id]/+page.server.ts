import { error } from '@sveltejs/kit';
import { apis } from '#lib/server/apis.ts';
import { ratingsFor } from '#lib/server/omdb.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { tmdb, omdbKey, fetcher } = await apis();
	const title = await tmdb.title(params.kind, params.id);
	if (!title) error(404, 'Not found');
	return {
		title,
		// Streamed: the page shows straight away and the scores fill in.
		ratings:
			title.imdbId && omdbKey
				? ratingsFor(locals.db, title.imdbId, omdbKey, fetcher).catch(() => null)
				: Promise.resolve(null)
	};
};
