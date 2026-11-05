// Stand-ins for TMDB and OMDb in local development and the end-to-end tests
// (see apis.ts), so neither needs keys. Made-up titles; real service logos.
import type { RawOmdb } from './omdb.ts';
import type { RawEpisode, RawSummary, RawTitle } from './tmdb.ts';

const DAY = 86_400_000;
/** Days from today, YYYY-MM-DD. */
const day = (by: number) => new Date(Date.now() + by * DAY).toISOString().slice(0, 10);

const NETFLIX = {
	provider_id: 8,
	provider_name: 'Netflix',
	logo_path: '/rK1KljqmbvO9HQa1PBFLILWah72.png',
	display_priority: 1
};
const PRIME = {
	provider_id: 9,
	provider_name: 'Amazon Prime Video',
	logo_path: '/gMZdpavHmxFNnLpMHwVxfqeux2g.png',
	display_priority: 2
};
const IPLAYER = {
	provider_id: 38,
	provider_name: 'BBC iPlayer',
	logo_path: '/vi6XJCpJ9GpAPD3rDSRzMC812Z.png',
	display_priority: 18
};
const STORE = {
	provider_id: 2,
	provider_name: 'Apple TV Store',
	logo_path: '/qdEGArH3lKfFnAtYXMkSYk5wxuG.png',
	display_priority: 6
};
const CHANNEL = {
	provider_id: 1825,
	provider_name: 'HBO Max Amazon Channel',
	logo_path: '/64fLWeSyZ1KQZhIdvTdy4QHeWty.png'
};
const SERVICES = [NETFLIX, PRIME, STORE, IPLAYER, CHANNEL].map((p, i) => ({
	...p,
	display_priorities: { GB: i + 1 }
}));

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
		release_dates: { results: [{ iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] }] },
		'watch/providers': {
			results: {
				GB: {
					link: 'https://www.themoviedb.org/movie/1001/watch?locale=GB',
					flatrate: [NETFLIX],
					rent: [STORE],
					buy: [STORE, PRIME]
				}
			}
		}
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
		seasons: [
			{ season_number: 0, name: 'Specials', episode_count: 1 },
			{ season_number: 1, name: 'Series 1', episode_count: 3, air_date: '2022-09-04' },
			{ season_number: 2, name: 'Series 2', episode_count: 3, air_date: '2023-09-03' },
			{ season_number: 3, name: 'Series 3', episode_count: 3, air_date: day(-10) }
		],
		external_ids: { imdb_id: 'tt2000001' },
		videos: { results: [] },
		content_ratings: { results: [{ iso_3166_1: 'GB', rating: '15' }] },
		'watch/providers': { results: { GB: { free: [IPLAYER] } } }
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
		seasons: [
			{ season_number: 1, episode_count: 2, air_date: '2019-01-15' },
			{ season_number: 2, episode_count: 2, air_date: '2020-01-15' }
		]
	}
];

/** Episodes: weekly from the season's start, so Harbour Lights' last is still to come. */
function season(show: RawTitle, n: number): RawEpisode[] | null {
	const s = show.seasons?.find((x) => x.season_number === n);
	if (!s?.air_date) return null;
	return Array.from({ length: s.episode_count ?? 0 }, (_, i) => ({
		season_number: n,
		episode_number: i + 1,
		name: `${show.name} ${n}.${i + 1}`,
		air_date: new Date(Date.parse(s.air_date!) + i * 7 * DAY).toISOString().slice(0, 10),
		runtime: 45,
		still_path: null,
		overview: ''
	}));
}

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
	if (path.startsWith('/watch/providers/')) return json({ results: SERVICES });
	if (path === '/search/multi') {
		const words = (url.searchParams.get('query') ?? '').toLowerCase();
		const results: RawSummary[] = TITLES.filter((t) =>
			(t.title ?? t.name ?? '').toLowerCase().includes(words)
		);
		return json({ results });
	}
	const [, kind, id, , n] = path.split('/');
	const title = TITLES.find((t) => t.media_type === kind && t.id === Number(id));
	const episodes = title && n !== undefined ? season(title, Number(n)) : undefined;
	if (episodes !== undefined) return episodes ? json({ episodes }) : json({}, 404);
	return title ? json(title) : json({ status_message: 'Not found' }, 404);
};
