import { describe, expect, it } from 'vitest';
import { user, watchlist } from './db/schema.ts';
import { fakeFetch } from './fake-apis.ts';
import { nextAfter, setWatched, updateProgress, watchedEpisodes } from './episodes.ts';
import { testDb } from './test-db.ts';
import { tmdb } from './tmdb.ts';

const seasons = [1, 2, 3].map((n) => ({ number: n, name: `S${n}`, episodes: 3, airDate: null }));
const ep = (season: number, episode: number) => ({ season, episode });

describe('nextAfter', () => {
	it('follows the latest watched, into the next season, until caught up', () => {
		expect(nextAfter(seasons, [])).toBeNull();
		expect(nextAfter(seasons, [ep(1, 1)])).toEqual(ep(1, 2));
		expect(nextAfter(seasons, [ep(1, 3), ep(1, 1)])).toEqual(ep(2, 1));
		// Started midway: earlier gaps don't matter.
		expect(nextAfter(seasons, [ep(3, 1)])).toEqual(ep(3, 2));
		expect(nextAfter(seasons, [ep(3, 3)])).toBeNull();
	});
});

describe('tracking', () => {
	it('ticks and unticks a long season (past D1’s bound value limit)', async () => {
		const db = await testDb();
		await db.insert(user).values({ email: 'a@example.com', name: 'A' });
		const all = Array.from({ length: 120 }, (_, i) => i + 1);
		await setWatched(db, 1, 1, all, true, 1);
		expect(await watchedEpisodes(db, 1)).toHaveLength(120);
		await setWatched(db, 1, 1, all.slice(1), false, 1);
		expect(await watchedEpisodes(db, 1)).toEqual([ep(1, 1)]);
	});

	const api = tmdb('token', fakeFetch);

	it('ticks and unticks, adds the show to the watchlist and finds the next episode', async () => {
		const db = await testDb();
		await db.insert(user).values({ email: 'a@example.com', name: 'A' });
		const show = (await api.title('tv', 2001))!;

		await setWatched(db, 2001, 1, [1, 2, 3], true, 1);
		const next = await updateProgress(db, api, show, 1, { ticked: true });
		expect([next?.season, next?.number, next?.name]).toEqual([2, 1, 'Harbour Lights 2.1']);
		const [row] = await db.select().from(watchlist);
		expect([row.name, row.nextSeason, row.nextEpisode]).toEqual(['Harbour Lights', 2, 1]);
		expect(row.watchedAt).not.toBeNull();

		await setWatched(db, 2001, 1, [2, 3], false, 1);
		expect(await watchedEpisodes(db, 2001)).toEqual([ep(1, 1)]);
		expect((await updateProgress(db, api, show, 1))?.number).toBe(2);
	});
});
