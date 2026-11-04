import { describe, expect, it } from 'vitest';
import { user } from './db/schema.ts';
import { testDb } from './test-db.ts';
import { tmdb } from './tmdb.ts';
import { fakeFetch } from './fake-apis.ts';
import {
	addToWatchlist,
	onWatchlist,
	refreshListed,
	removeFromWatchlist,
	services,
	setServices,
	watchlistRows
} from './watchlist.ts';

const api = tmdb('token', fakeFetch);

async function setup() {
	const db = await testDb();
	await db.insert(user).values({ email: 'a@example.com', name: 'A' });
	return db;
}

describe('watchlist', () => {
	it('adds, lists newest first, and removes', async () => {
		const db = await setup();
		const film = (await api.title('movie', 1001))!;
		const show = (await api.title('tv', 2001))!;
		await addToWatchlist(db, film, 1, new Date('2026-11-01'));
		await addToWatchlist(db, show, 1, new Date('2026-11-02'));
		// Adding again changes nothing.
		await addToWatchlist(db, film, 1, new Date('2026-11-03'));

		const rows = await watchlistRows(db);
		expect(rows.map((r) => [r.name, r.watchableOn])).toEqual([
			['Harbour Lights', [38]],
			['The Long Light', [8]]
		]);
		expect(await onWatchlist(db)).toEqual(new Set(['tv-2001', 'movie-1001']));

		await removeFromWatchlist(db, 'movie', 1001);
		expect(await onWatchlist(db)).toEqual(new Set(['tv-2001']));
	});

	it('refreshes where to watch for listed titles only', async () => {
		const db = await setup();
		const film = (await api.title('movie', 1001))!;
		expect(await refreshListed(db, film)).toBe(false);
		await addToWatchlist(db, film, 1);
		const moved = { ...film, providers: { ...film.providers, stream: [], free: [] } };
		expect(await refreshListed(db, moved)).toBe(true);
		expect((await watchlistRows(db))[0].watchableOn).toEqual([]);
	});
});

describe('services', () => {
	it('replaces the chosen services, keeping their order', async () => {
		const db = await setup();
		const all = await api.services();
		await setServices(db, [all[3], all[0]]);
		expect((await services(db)).map((s) => s.name)).toEqual(['BBC iPlayer', 'Netflix']);
		await setServices(db, []);
		expect(await services(db)).toEqual([]);
	});
});
