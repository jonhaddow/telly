import { describe, expect, it } from 'vitest';
import { checkTitles, combine, news } from './alerts.ts';
import { user, watchlist, type WatchlistRow } from './db/schema.ts';
import { fakeFetch } from './fake-apis.ts';
import { testDb } from './test-db.ts';
import { tmdb } from './tmdb.ts';
import { setServices } from './watchlist.ts';
import type { Title } from '../titles.ts';

const api = tmdb('token', fakeFetch);
const TODAY = '2026-11-05';
const ours = [{ id: 8, name: 'Netflix' }];

const show = (latest: Title['latest'], providers: number[] = []): Title => ({
	kind: 'tv',
	id: 7,
	name: 'Show',
	years: '2020–',
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
	providers: {
		link: null,
		stream: providers.map((id) => ({ id, name: `P${id}`, logo: null })),
		free: [],
		buy: []
	},
	latest
});
const episode = (season: number, number: number, airDate: string) => ({
	season,
	number,
	name: `Ep ${number}`,
	airDate,
	runtime: null,
	still: null,
	overview: ''
});
const row = (r: Partial<WatchlistRow>) =>
	({
		watchableOn: [],
		checkedAt: '2026-11-04T10:00:00Z',
		latestAired: '2x3',
		watchedAt: null,
		...r
	}) as WatchlistRow;

describe('news', () => {
	it('tells of every new episode of a show being watched', () => {
		const t = show(episode(2, 4, '2026-11-04'));
		const [n] = news(row({ watchedAt: '2026-11-01' }), t, ours, TODAY);
		expect([n.title, n.body, n.url]).toEqual(['New Show', 'S2 E4 · Ep 4', '/tv/7']);
		// Already told.
		expect(news(row({ watchedAt: 'x', latestAired: '2x4' }), t, ours, TODAY)).toEqual([]);
	});

	it('says nothing of a show part way through', () => {
		const t = show(episode(3, 1, '2026-11-04'));
		// Next up was 2x2, before the latest out (2x3).
		const behind = row({ watchedAt: 'x', nextSeason: 2, nextEpisode: 2 });
		expect(news(behind, t, ours, TODAY)).toEqual([]);
		// Next up was 2x4, not out yet: caught up.
		const waiting = row({ watchedAt: 'x', nextSeason: 2, nextEpisode: 4 });
		expect(news(waiting, t, ours, TODAY)).toHaveLength(1);
	});

	it('tells of a new season only for a show not started', () => {
		expect(news(row({}), show(episode(2, 4, '2026-11-04')), ours, TODAY)).toEqual([]);
		const [n] = news(row({}), show(episode(3, 1, '2026-11-05')), ours, TODAY);
		expect(n.title).toBe('Show: season 3 is out');
		// All of it at once.
		const [all] = news(row({}), show(episode(3, 8, '2026-11-05')), ours, TODAY);
		expect(all.title).toBe('Show: season 3 is out');
	});

	it('ignores old episodes, and anything on the first check', () => {
		const old = show(episode(2, 4, '2026-10-20'));
		expect(news(row({ watchedAt: 'x' }), old, ours, TODAY)).toEqual([]);
		const fresh = show(episode(2, 4, '2026-11-05'), [8]);
		expect(news(row({ watchedAt: 'x', checkedAt: null }), fresh, ours, TODAY)).toEqual([]);
	});

	it('tells when a title arrives on one of our services', () => {
		const t = show(null, [8, 9]);
		expect(news(row({}), t, ours, TODAY).map((n) => n.title)).toEqual(['Show is on Netflix']);
		expect(news(row({ watchableOn: [8] }), t, ours, TODAY)).toEqual([]);
	});
});

describe('combine', () => {
	it('sends one as it is, and several as one', () => {
		const n = (title: string) => ({ title, body: '', url: '/x', badge: 0 });
		expect(combine([])).toBeNull();
		expect(combine([n('A')])).toEqual(n('A'));
		expect(combine([n('A'), n('B')])).toMatchObject({
			title: '2 updates',
			body: 'A · B',
			url: '/'
		});
	});
});

describe('checkTitles', () => {
	it('checks the longest-unchecked titles and keeps their copies current', async () => {
		const db = await testDb();
		await db.insert(user).values({ email: 'a@example.com', name: 'A' });
		await setServices(db, [{ id: 8, name: 'Netflix', logo: null }]);
		const base = { addedBy: 1, years: null, poster: null, addedAt: '2026-11-01' };
		await db.insert(watchlist).values([
			// Checked before, when it wasn't on Netflix.
			{
				...base,
				kind: 'movie',
				tmdbId: 1001,
				name: 'Old',
				watchableOn: [],
				checkedAt: '2026-11-01'
			},
			{ ...base, kind: 'tv', tmdbId: 2001, name: 'Harbour Lights', watchableOn: [38] }
		]);

		// The never-checked show first; it's only noted.
		expect(await checkTitles(db, api, TODAY, { limit: 1 })).toEqual([]);
		const notices = await checkTitles(db, api, TODAY, { limit: 1 });
		expect(notices.map((n) => n.title)).toEqual(['The Long Light is on Netflix']);

		const rows = await db.select().from(watchlist);
		expect(rows.map((r) => [r.name, r.latestAired, r.watchableOn])).toEqual([
			['The Long Light', null, [8]],
			['Harbour Lights', '3x2', [38]]
		]);

		// Both checked just now: nothing's due until tomorrow.
		await db.update(watchlist).set({ name: 'Unchanged' });
		await checkTitles(db, api, TODAY);
		const after = await db.select().from(watchlist);
		expect(after.map((r) => r.name)).toEqual(['Unchanged', 'Unchanged']);
	});

	it('leaves seen films alone', async () => {
		const db = await testDb();
		await db.insert(user).values({ email: 'a@example.com', name: 'A' });
		const film = { kind: 'movie' as const, watchableOn: [], addedAt: '2026-11-01' };
		await db.insert(watchlist).values([
			{ ...film, tmdbId: 1001, name: 'Seen', seenAt: '2026-11-02' },
			{ ...film, tmdbId: 1002, name: 'Not seen' }
		]);
		await checkTitles(db, api, TODAY);
		const rows = await db.select().from(watchlist);
		expect(rows.map((r) => [r.tmdbId, !!r.checkedAt])).toEqual([
			[1001, false],
			[1002, true]
		]);
	});
});
