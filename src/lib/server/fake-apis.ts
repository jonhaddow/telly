// Stand-ins for TMDB and OMDb in local development and the end-to-end tests
// (see apis.ts), so neither needs keys or the network. Made-up titles.
import type { RawOmdb } from './omdb.ts';
import type { RawSummary, RawTitle } from './tmdb.ts';

const TITLES: (RawTitle & { media_type: 'movie' | 'tv' })[] = [
	{
		media_type: 'movie',
		id: 1001,
		title: 'The Long Light',
		release_date: '2024-03-08',
		poster_path: null,
		backdrop_path: null,
		overview:
			'A lighthouse keeper on a remote Scottish island finds a message that changes everything.',
		tagline: 'Some signals are meant to be found.',
		genres: [
			{ id: 18, name: 'Drama' },
			{ id: 9648, name: 'Mystery' }
		],
		runtime: 112,
		imdb_id: 'tt1000001',
		videos: {
			results: [
				{
					key: 'fakeTrailer1',
					site: 'YouTube',
					type: 'Trailer',
					official: true,
					published_at: '2024-01-10T00:00:00Z'
				}
			]
		},
		release_dates: { results: [{ iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] }] }
	},
	{
		media_type: 'tv',
		id: 2001,
		name: 'Harbour Lights',
		first_air_date: '2022-09-04',
		last_air_date: '2025-11-02',
		status: 'Returning Series',
		poster_path: null,
		backdrop_path: null,
		overview: 'A seaside town’s police station, its regulars and the secrets they keep.',
		genres: [
			{ id: 80, name: 'Crime' },
			{ id: 18, name: 'Drama' }
		],
		episode_run_time: [45],
		number_of_seasons: 3,
		number_of_episodes: 24,
		external_ids: { imdb_id: 'tt2000001' },
		videos: { results: [] },
		content_ratings: { results: [{ iso_3166_1: 'GB', rating: '15' }] }
	},
	{
		media_type: 'tv',
		id: 2002,
		name: 'Lighthouse Kitchen',
		first_air_date: '2019-01-15',
		last_air_date: '2021-03-01',
		status: 'Ended',
		poster_path: null,
		overview: 'Cooks compete in a kitchen at the end of a pier.',
		genres: [{ id: 10764, name: 'Reality' }],
		number_of_seasons: 2,
		number_of_episodes: 16
	}
];

const RATINGS: Record<string, RawOmdb> = {
	tt1000001: {
		Response: 'True',
		imdbRating: '7.8',
		imdbVotes: '152,301',
		Metascore: '74',
		Ratings: [{ Source: 'Rotten Tomatoes', Value: '91%' }]
	},
	tt2000001: { Response: 'True', imdbRating: '8.2', imdbVotes: '48,112', Metascore: 'N/A' }
};

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const fakeFetch: typeof fetch = async (input) => {
	const url = new URL(input instanceof Request ? input.url : input);
	if (url.hostname === 'www.omdbapi.com') {
		return json(RATINGS[url.searchParams.get('i') ?? ''] ?? { Response: 'False' });
	}
	const path = url.pathname.replace(/^\/3/, '');
	if (path === '/search/multi') {
		const words = (url.searchParams.get('query') ?? '').toLowerCase();
		const results: RawSummary[] = TITLES.filter((t) =>
			(t.title ?? t.name ?? '').toLowerCase().includes(words)
		);
		return json({ results });
	}
	const [, kind, id] = path.split('/');
	const title = TITLES.find((t) => t.media_type === kind && t.id === Number(id));
	return title ? json(title) : json({ status_message: 'Not found' }, 404);
};
