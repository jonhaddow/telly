import { fail, type RequestEvent } from '@sveltejs/kit';
import { today } from '../dates.ts';
import { apis } from './apis.ts';
import { setWatched, updateProgress } from './episodes.ts';

const positive = (v: FormDataEntryValue | null) => {
	const n = Number(v);
	return Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Tick an episode (show, season, episode, watched) or a whole season's aired
 * episodes (no episode), for any page that shows them.
 */
export const episodeActions = {
	watched: async ({ request, locals }: RequestEvent) => {
		const form = await request.formData();
		const showId = positive(form.get('show'));
		const season = positive(form.get('season'));
		const episode = positive(form.get('episode'));
		const watched = form.get('watched') === '1';
		if (!showId || !season) return fail(400);

		const { tmdb } = await apis();
		const show = await tmdb.title('tv', showId);
		if (!show) return fail(404);
		let episodes = episode ? [{ season, episode }] : [];
		if (!episode) {
			const day = today();
			const all = (await tmdb.season(showId, season)) ?? [];
			// Not ones still to come.
			episodes = all
				.filter((e) => !watched || (e.airDate && e.airDate <= day))
				.map((e) => ({ season, episode: e.number }));
		}
		await setWatched(locals.db, showId, episodes, watched, locals.user!.id);
		await updateProgress(locals.db, tmdb, show, locals.user!.id, { ticked: watched });
	}
};
