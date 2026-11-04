import { redirect } from '@sveltejs/kit';
import { apis } from '#lib/server/apis.ts';
import { services, setServices } from '#lib/server/watchlist.ts';
import type { Actions, PageServerLoad } from './$types';

/** The 30 most popular: past that it's niche, and the list gets long. */
const SHOWN = 30;

export const load: PageServerLoad = async ({ locals }) => {
	const [all, ours] = await Promise.all([(await apis()).tmdb.services(), services(locals.db)]);
	const chosen = new Set(ours.map((s) => s.id));
	// Keep any chosen ones that have dropped out of the top.
	return {
		services: all.filter((s, i) => i < SHOWN || chosen.has(s.id)),
		chosen: [...chosen]
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
