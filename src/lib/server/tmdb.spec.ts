import { describe, expect, it } from 'vitest';
import { fakeFetch } from './fake-apis.ts';
import { pickTrailer, tmdb, toProviders, toTitle } from './tmdb.ts';

const video = (key: string, type: string, official: boolean, published_at: string) => ({
	key,
	site: 'YouTube',
	type,
	official,
	published_at
});

describe('pickTrailer', () => {
	it('prefers official trailers, then the newest', () => {
		expect(
			pickTrailer([
				video('teaser', 'Teaser', true, '2024-03-01'),
				video('fan', 'Trailer', false, '2024-02-01'),
				video('old', 'Trailer', true, '2023-01-01'),
				video('new', 'Trailer', true, '2024-01-01')
			])
		).toBe('new');
	});

	it('falls back to a teaser, and ignores clips and other sites', () => {
		expect(pickTrailer([video('t', 'Teaser', true, '2024-01-01')])).toBe('t');
		expect(pickTrailer([video('c', 'Clip', true, '2024-01-01')])).toBeNull();
		expect(
			pickTrailer([{ ...video('v', 'Trailer', true, '2024-01-01'), site: 'Vimeo' }])
		).toBeNull();
	});
});

describe('toTitle', () => {
	it('shows how long a show ran', () => {
		const show = { id: 1, name: 'S', first_air_date: '2019-01-01', last_air_date: '2023-05-01' };
		expect(toTitle('tv', { ...show, status: 'Ended' }).years).toBe('2019–2023');
		expect(toTitle('tv', { ...show, status: 'Returning Series' }).years).toBe('2019–');
		expect(toTitle('tv', { ...show, status: 'Ended', last_air_date: '2019-06-01' }).years).toBe(
			'2019'
		);
	});

	it('copes with a title that has nothing but an id', () => {
		for (const kind of ['movie', 'tv'] as const) {
			expect(toTitle(kind, { id: 1, runtime: 0 })).toEqual({
				kind,
				id: 1,
				name: 'Untitled',
				years: null,
				poster: null,
				overview: '',
				tagline: null,
				backdrop: null,
				genres: [],
				runtime: null,
				certificate: null,
				seasons: [],
				imdbId: null,
				trailer: null,
				providers: { link: null, stream: [], free: [], buy: [] },
				latest: null
			});
		}
	});

	it('lists seasons in order, without specials or empty ones', () => {
		const show = toTitle('tv', {
			id: 1,
			seasons: [
				{ season_number: 2, name: '', episode_count: 8, air_date: null },
				{ season_number: 0, name: 'Specials', episode_count: 2 },
				{ season_number: 3, name: 'Series 3', episode_count: 0 },
				{ season_number: 1, name: 'Series 1', episode_count: 6, air_date: '2020-01-01' }
			]
		});
		expect(show.seasons).toEqual([
			{ number: 1, name: 'Series 1', episodes: 6, airDate: '2020-01-01' },
			{ number: 2, name: 'Season 2', episodes: 8, airDate: null }
		]);
	});

	it('reads the UK certificate and IMDb id for each kind', () => {
		const film = toTitle('movie', {
			id: 1,
			title: 'F',
			imdb_id: 'tt1',
			release_dates: {
				results: [
					{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] },
					{ iso_3166_1: 'GB', release_dates: [{ certification: '' }, { certification: '15' }] }
				]
			}
		});
		expect([film.certificate, film.imdbId]).toEqual(['15', 'tt1']);
		const show = toTitle('tv', {
			id: 2,
			name: 'S',
			external_ids: { imdb_id: 'tt2' },
			content_ratings: { results: [{ iso_3166_1: 'GB', rating: '12' }] }
		});
		expect([show.certificate, show.imdbId]).toEqual(['12', 'tt2']);
	});
});

describe('tmdb', () => {
	const api = tmdb('token', fakeFetch);

	it('searches films and shows', async () => {
		const results = await api.search('light');
		expect(results.map((r) => [r.kind, r.name])).toEqual([
			['movie', 'The Long Light'],
			['tv', 'Harbour Lights'],
			['tv', 'Lighthouse Kitchen']
		]);
	});

	it('returns null for an unknown title', async () => {
		expect(await api.title('movie', 999)).toBeNull();
		expect((await api.title('movie', 1001))?.trailer).toBe('fakeTrailer1');
	});
});

describe('toProviders', () => {
	const p = (id: number, display_priority: number) => ({
		provider_id: id,
		provider_name: `P${id}`,
		display_priority
	});

	it('lists each service once, in its cheapest group, most popular first', () => {
		const r = toProviders({
			flatrate: [p(2, 5), p(1, 1)],
			free: [p(3, 3), p(1, 1)],
			ads: [p(4, 2)],
			rent: [p(5, 9), p(2, 5)],
			buy: [p(5, 9), p(6, 8)]
		});
		expect([r.stream, r.free, r.buy].map((g) => g.map((x) => x.id))).toEqual([
			[1, 2],
			[4, 3],
			[6, 5]
		]);
		expect(toProviders(undefined)).toEqual({ link: null, stream: [], free: [], buy: [] });
	});
});

describe('services', () => {
	it('lists UK services once each, without add-on channels or shops', async () => {
		const names = (await tmdb('token', fakeFetch).services()).map((s) => s.name);
		expect(names).toEqual(['Netflix', 'Amazon Prime Video', 'BBC iPlayer']);
	});
});
