import { describe, expect, it } from 'vitest';
import { fakeFetch } from './fake-apis.ts';
import { pickTrailer, tmdb, toTitle } from './tmdb.ts';

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
