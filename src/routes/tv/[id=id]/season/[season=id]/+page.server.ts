import { error } from '@sveltejs/kit';
import { today } from '#lib/dates.ts';
import { apis } from '#lib/server/apis.ts';
import { episodeActions } from '#lib/server/episode-actions.ts';
import { watchedEpisodes } from '#lib/server/episodes.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { tmdb } = await apis();
	const [show, episodes, watched] = await Promise.all([
		tmdb.title('tv', params.id),
		tmdb.season(params.id, params.season),
		watchedEpisodes(locals.db, params.id)
	]);
	const season = show?.seasons.find((s) => s.number === params.season);
	if (!show || !season || !episodes) error(404, 'Not found');
	const seen = new Set(watched.filter((w) => w.season === season.number).map((w) => w.episode));
	return {
		show: { id: show.id, name: show.name },
		season,
		today: today(),
		episodes: episodes.map((e) => ({ ...e, watched: seen.has(e.number) }))
	};
};

export const actions: Actions = episodeActions;
