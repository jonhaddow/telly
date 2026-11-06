import { redirect } from '@sveltejs/kit';
import { apis } from '#lib/server/apis.ts';
import { today } from '#lib/dates.ts';
import { isSeen, services, setServices, watchlistRows } from '#lib/server/watchlist.ts';
import type { Actions, PageServerLoad } from './$types';

/** The 30 most popular: past that it's niche, and the list gets long. */
const SHOWN = 30;
/** Services with the most of the watchlist. */
const MOST = 6;

export const load: PageServerLoad = async ({ locals }) => {
	const [all, ours, rows] = await Promise.all([
		(await apis()).tmdb.services(),
		services(locals.db),
		watchlistRows(locals.db)
	]);
	const chosen = new Set(ours.map((s) => s.id));
	// How much of the watchlist each service shows, to weigh up subscribing.
	const day = today();
	const counts = new Map<number, number>();
	for (const r of rows)
		if (!isSeen(r, day)) for (const id of r.watchableOn) counts.set(id, (counts.get(id) ?? 0) + 1);
	const most = all
		.map((s) => ({ ...s, count: counts.get(s.id) ?? 0 }))
		.filter((s) => s.count)
		.sort((a, b) => b.count - a.count)
		.slice(0, MOST);
	// Keep any chosen ones that have dropped out of the top.
	return {
		services: all.filter((s, i) => i < SHOWN || chosen.has(s.id)),
		chosen: [...chosen],
		most
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const ids = new Set((await request.formData()).getAll('service').map(Number));
		const all = await (await apis()).tmdb.services();
		await setServices(
			locals.db,
			all.filter((s) => ids.has(s.id))
		);
		redirect(303, '/settings');
	}
};
