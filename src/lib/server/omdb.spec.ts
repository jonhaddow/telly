import { describe, expect, it, vi } from 'vitest';
import { ratingsFor, toRatings } from './omdb.ts';
import { testDb } from './test-db.ts';

const raw = {
	Response: 'True' as const,
	imdbRating: '8.7',
	imdbVotes: '2,104,331',
	Metascore: 'N/A',
	Ratings: [{ Source: 'Rotten Tomatoes', Value: '83%' }]
};

describe('toRatings', () => {
	it('reads the scores, leaving out N/A', () => {
		expect(toRatings(raw)).toEqual({
			imdb: 8.7,
			imdbVotes: 2_104_331,
			rottenTomatoes: 83,
			metacritic: null
		});
		expect(toRatings({ Response: 'False' })).toBeNull();
	});
});

describe('ratingsFor', () => {
	const ok = () => vi.fn(async () => Response.json(raw));
	const day = (n: number) => new Date(Date.UTC(2026, 10, n));

	it('keeps scores for a week', async () => {
		const db = await testDb();
		const fetcher = ok();
		await ratingsFor(db, 'tt1', 'key', fetcher, day(1));
		await ratingsFor(db, 'tt1', 'key', fetcher, day(7));
		expect(fetcher).toHaveBeenCalledTimes(1);
		await ratingsFor(db, 'tt1', 'key', fetcher, day(9));
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('falls back to old scores when OMDb fails', async () => {
		const db = await testDb();
		await ratingsFor(db, 'tt1', 'key', ok(), day(1));
		const down = vi.fn(async () => new Response('Limit reached', { status: 401 }));
		expect((await ratingsFor(db, 'tt1', 'key', down, day(20)))?.imdb).toBe(8.7);
		expect(await ratingsFor(db, 'tt2', 'key', down, day(20))).toBeNull();
	});
});
