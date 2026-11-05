// The hourly check (worker/entry.js → /check): checks the listed titles (not
// seen films) on TMDB once a day, keeps their copies current, and says what's
// new: an episode of a show being watched, a new season of one that isn't yet,
// or a title arriving on one of our services. A few titles a run, longest ago
// first, so each run stays within the free plan's CPU and 50 outbound requests.
import { asc, eq, and, isNull, lt, or, sql } from 'drizzle-orm';
import { addDays } from '../dates.ts';
import { watchlist, type WatchlistRow } from './db/schema.ts';
import type { DB } from './db/index.ts';
import { updateProgress } from './episodes.ts';
import type { PushPayload } from './push.ts';
import type { Tmdb } from './tmdb.ts';
import { services } from './watchlist.ts';
import { episodeCode, titlePath, watchableOn, type Title } from '../titles.ts';

/** Titles a run: each is one or two TMDB calls. */
const PER_RUN = 12;

/** A title is checked once a day: 23 hours, so its hourly slot doesn't drift later. */
const RECHECK_HOURS = 23;

/** Episodes older than this when first seen aren't news (a missed check, say). */
const NEWS_DAYS = 3;

const airedKey = (t: Title) => (t.latest ? `${t.latest.season}x${t.latest.number}` : null);

/** What's new about one title since it was last checked. */
export function news(
	row: WatchlistRow,
	t: Title,
	ours: { id: number; name: string }[],
	today: string
): PushPayload[] {
	// The first check only takes note.
	if (!row.checkedAt) return [];
	const notices: PushPayload[] = [];
	const url = titlePath(t);

	const before = new Set(row.watchableOn);
	const after = new Set(watchableOn(t.providers));
	const arrived = ours.filter((s) => after.has(s.id) && !before.has(s.id));
	if (arrived.length) {
		notices.push({
			title: `${t.name} is on ${arrived.map((s) => s.name).join(' and ')}`,
			body: 'From your watchlist.',
			url,
			badge: 0,
			tag: `on-${t.kind}-${t.id}`
		});
	}

	const latest = t.latest;
	const key = airedKey(t);
	const fresh = latest?.airDate && latest.airDate >= addDays(today, -NEWS_DAYS);
	if (latest && key !== row.latestAired && fresh) {
		// Watching it: every episode. Not yet: only a new season, even if it all
		// came out at once (latest 3x8 after 2x10).
		const seenSeason = Number(row.latestAired?.split('x')[0] ?? 0);
		if (row.watchedAt) {
			notices.push({
				title: `New ${t.name}`,
				body: `${episodeCode(latest)} · ${latest.name}`,
				url,
				badge: 0,
				tag: `ep-${t.id}`
			});
		} else if (latest.season > seenSeason) {
			notices.push({
				title: `${t.name}: season ${latest.season} is out`,
				body: latest.name,
				url,
				badge: 0,
				tag: `ep-${t.id}`
			});
		}
	}
	return notices;
}

/**
 * One notification for a run's notices: each push is an outbound request, and a
 * run has 50 for everything. Several become "3 updates", listing them.
 */
export function combine(notices: PushPayload[]): PushPayload | null {
	if (notices.length <= 1) return notices[0] ?? null;
	return {
		title: `${notices.length} updates`,
		body: notices.map((n) => n.title).join(' · '),
		url: '/',
		badge: 0,
		tag: 'updates'
	};
}

/** Checks the next few titles due; returns the notices to send. */
export async function checkTitles(
	db: DB,
	tmdb: Tmdb,
	today: string,
	{ limit = PER_RUN } = {}
): Promise<PushPayload[]> {
	const now = new Date();
	const due = new Date(now.getTime() - RECHECK_HOURS * 3600_000).toISOString();
	const [rows, ours] = await Promise.all([
		db
			.select()
			.from(watchlist)
			// Not seen films: nothing new to say about them.
			.where(
				and(isNull(watchlist.seenAt), or(isNull(watchlist.checkedAt), lt(watchlist.checkedAt, due)))
			)
			// Never checked first, then the longest ago.
			.orderBy(sql`${watchlist.checkedAt} IS NOT NULL`, asc(watchlist.checkedAt))
			.limit(limit),
		services(db)
	]);

	const results = await Promise.all(
		rows.map(async (row) => {
			const t = await tmdb.title(row.kind, row.tmdbId).catch((e: unknown) => {
				console.error('Check', row.kind, row.tmdbId, e);
				return null;
			});
			if (t && row.kind === 'tv' && row.watchedAt) {
				// Not fatal: the next check will try again.
				await updateProgress(db, tmdb, t).catch((e: unknown) =>
					console.error('Progress', row.tmdbId, e)
				);
			}
			await db
				.update(watchlist)
				.set({
					checkedAt: now.toISOString(),
					...(t && {
						name: t.name,
						years: t.years,
						poster: t.poster,
						watchableOn: watchableOn(t.providers),
						latestAired: airedKey(t)
					})
				})
				.where(and(eq(watchlist.kind, row.kind), eq(watchlist.tmdbId, row.tmdbId)));
			return t ? news(row, t, ours, today) : [];
		})
	);
	return results.flat();
}
