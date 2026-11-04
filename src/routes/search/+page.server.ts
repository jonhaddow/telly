import { apis } from '#lib/server/apis.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().slice(0, 100) ?? '';
	if (!q) return { q, results: [], failed: false };
	try {
		const { tmdb } = await apis();
		return { q, results: (await tmdb.search(q)).slice(0, 20), failed: false };
	} catch (e) {
		console.error(e);
		return { q, results: [], failed: true };
	}
};
