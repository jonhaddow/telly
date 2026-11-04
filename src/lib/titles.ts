// Films and shows as the app uses them, whichever API they came from. Shared by
// server and pages.

export const KINDS = ['movie', 'tv'] as const;
export type Kind = (typeof KINDS)[number];

/** A search result or list entry. */
export type TitleSummary = {
	kind: Kind;
	/** TMDB's id: unique within a kind only. */
	id: number;
	name: string;
	/** "2019", "2019–2023" or "2019–" (still running); null before it has a date. */
	years: string | null;
	poster: string | null;
};

export type Title = TitleSummary & {
	overview: string;
	tagline: string | null;
	backdrop: string | null;
	genres: string[];
	/** Minutes: the film, or a typical episode. */
	runtime: number | null;
	/** UK certificate: "15", "PG". */
	certificate: string | null;
	seasons: number | null;
	episodes: number | null;
	imdbId: string | null;
	/** YouTube video id of the trailer. */
	trailer: string | null;
};

export type Ratings = {
	imdb: number | null;
	imdbVotes: number | null;
	rottenTomatoes: number | null;
	metacritic: number | null;
};

/** The page for a film or show. */
export const titlePath = (t: Pick<TitleSummary, 'kind' | 'id'>) => `/${t.kind}/${t.id}`;

/** TMDB image, at a width it serves (w92, w185, w342, w500, w780). */
export const imageUrl = (path: string, width: 'w92' | 'w185' | 'w342' | 'w500' | 'w780') =>
	`https://image.tmdb.org/t/p/${width}${path}`;

/** "1h 52m", "45m". */
export function formatRuntime(minutes: number) {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });

/** "2.1M", "48K". */
export const formatVotes = (n: number) => compact.format(n);
