import { apis } from '#lib/server/apis.ts';
import { onWatchlist } from '#lib/server/watchlist.ts';
import { watchlistActions } from '#lib/server/watchlist-actions.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q')?.trim().slice(0, 100) ?? '';
	if (!q) return { q, results: [], failed: false };
	try {
		const { tmdb } = await apis();
		const [results, listed] = await Promise.all([tmdb.search(q), onWatchlist(locals.db)]);
		return {
			q,
			results: results.map((r) => ({ ...r, listed: listed.has(`${r.kind}-${r.id}`) })),
			failed: false
		};
	} catch (e) {
		console.error(e);
		return { q, results: [], failed: true };
	}
};

export const actions: Actions = watchlistActions;
