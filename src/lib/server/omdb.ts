// OMDb (https://www.omdbapi.com): IMDb, Rotten Tomatoes and Metacritic scores
// by IMDb id. The free key allows 1,000 lookups a day, so scores are kept in
// D1 for a week (the rating table).
import { eq } from 'drizzle-orm';
import { rating } from './db/schema.ts';
import type { DB } from './db/index.ts';
import type { Ratings } from '../titles.ts';

const KEEP_DAYS = 7;

export type RawOmdb = {
	Response: 'True' | 'False';
	imdbRating?: string;
	imdbVotes?: string;
	Metascore?: string;
	Ratings?: { Source: string; Value: string }[];
};

/** OMDb writes "N/A" for anything it doesn't have. */
function num(value: string | undefined) {
	const n = Number(value?.replace(/[,%]/g, '').split('/')[0]);
	return value && value !== 'N/A' && Number.isFinite(n) ? n : null;
}

export function toRatings(r: RawOmdb): Ratings | null {
	if (r.Response !== 'True') return null;
	return {
		imdb: num(r.imdbRating),
		imdbVotes: num(r.imdbVotes),
		rottenTomatoes: num(r.Ratings?.find((x) => x.Source === 'Rotten Tomatoes')?.Value),
		metacritic: num(r.Metascore)
	};
}

/**
 * The scores for an IMDb id: kept ones if under a week old, else fresh from
 * OMDb. If OMDb is down or over its limit, older kept ones, or null.
 */
export async function ratingsFor(
	db: DB,
	imdbId: string,
	key: string,
	fetcher: typeof fetch = fetch,
	now = new Date()
): Promise<Ratings | null> {
	const [row] = await db.select().from(rating).where(eq(rating.imdbId, imdbId));
	const kept: Ratings | null = row
		? {
				imdb: row.imdb,
				imdbVotes: row.imdbVotes,
				rottenTomatoes: row.rottenTomatoes,
				metacritic: row.metacritic
			}
		: null;
	if (row && now.getTime() - Date.parse(row.fetchedAt) < KEEP_DAYS * 86_400_000) return kept;

	let fresh: Ratings | null = null;
	try {
		const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(key)}`;
		const res = await fetcher(url);
		if (res.ok) fresh = toRatings((await res.json()) as RawOmdb);
		else console.error('OMDb', res.status);
	} catch (e) {
		console.error('OMDb', e);
	}
	if (!fresh) return kept;

	const values = { imdbId, ...fresh, fetchedAt: now.toISOString() };
	await db.insert(rating).values(values).onConflictDoUpdate({ target: rating.imdbId, set: values });
	return fresh;
}
