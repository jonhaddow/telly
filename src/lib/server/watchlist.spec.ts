import { describe, expect, it } from 'vitest';
import { user } from './db/schema.ts';
import { testDb } from './test-db.ts';
import { tmdb } from './tmdb.ts';
import { fakeFetch } from './fake-apis.ts';
import {
	addToWatchlist,
	isSeen,
	onWatchlist,
	refreshListed,
	removeFromWatchlist,
	services,
	setSeen,
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
		expect(await refreshListed(db, film)).toBeNull();
		await addToWatchlist(db, film, 1);
		expect((await watchlistRows(db))[0].toRent).toBe(true);
		const moved = { ...film, providers: { ...film.providers, stream: [], free: [], buy: [] } };
		expect((await refreshListed(db, moved))?.watchableOn).toEqual([]);
		const [row] = await watchlistRows(db);
		expect([row.watchableOn, row.toRent]).toEqual([[], false]);
	});
});

describe('seen', () => {
	const row = {
		kind: 'tv' as const,
		seenAt: null,
		watchedAt: '2026-11-01',
		nextSeason: null,
		nextAirDate: null
	};

	it('is a show watched up to its latest episode out', () => {
		expect(isSeen(row, '2026-11-05')).toBe(true);
		// Next one announced but not out yet, or no date.
		expect(isSeen({ ...row, nextSeason: 2, nextAirDate: '2026-12-01' }, '2026-11-05')).toBe(true);
		expect(isSeen({ ...row, nextSeason: 2 }, '2026-11-05')).toBe(true);
		// Next one out, or none watched.
		expect(isSeen({ ...row, nextSeason: 2, nextAirDate: '2026-11-05' }, '2026-11-05')).toBe(false);
		expect(isSeen({ ...row, watchedAt: null }, '2026-11-05')).toBe(false);
	});

	it('marks a film seen, listing it, and back to the watchlist', async () => {
		const db = await setup();
		const film = (await api.title('movie', 1001))!;
		await setSeen(db, film, true, 1, new Date('2026-11-02'));
		const [r] = await watchlistRows(db);
		expect([r.name, r.seenAt]).toEqual(['The Long Light', '2026-11-02T00:00:00.000Z']);
		expect(isSeen(r, '2026-11-05')).toBe(true);
		await setSeen(db, film, false, 1);
		expect(isSeen((await watchlistRows(db))[0], '2026-11-05')).toBe(false);
	});
});

describe('services', () => {
	it('replaces the chosen services, keeping their order', async () => {
		const db = await setup();
		const all = await api.services();
		await setServices(db, [all[2], all[0]]);
		expect((await services(db)).map((s) => s.name)).toEqual(['BBC iPlayer', 'Netflix']);
		await setServices(db, []);
		expect(await services(db)).toEqual([]);
	});
});
