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
	/** A show's seasons in order, without specials (season 0); none for a film. */
	seasons: Season[];
	imdbId: string | null;
	/** YouTube video id of the trailer. */
	trailer: string | null;
	/** Where to watch it in the UK (JustWatch's data, via TMDB). */
	providers: Providers;
	/** A show's most recent episode out. */
	latest: Episode | null;
};

export type Season = { number: number; name: string; episodes: number; airDate: string | null };

export type Episode = {
	season: number;
	number: number;
	name: string;
	/** UK date it first aired, YYYY-MM-DD; null if not announced. */
	airDate: string | null;
	runtime: number | null;
	still: string | null;
	overview: string;
};

/** "S2 E5". */
export const episodeCode = (e: { season: number; number: number }) => `S${e.season} E${e.number}`;

/** A streaming service, shop or channel. */
export type Provider = { id: number; name: string; logo: string | null };

export type Providers = {
	/** TMDB's where-to-watch page for the title, which links on to each service. */
	link: string | null;
	/** Included with a subscription. */
	stream: Provider[];
	/** Free, perhaps with ads. */
	free: Provider[];
	/** To rent or buy. */
	buy: Provider[];
};

/** Ids of the services showing it at no extra cost: subscription or free. */
export const watchableOn = (p: Providers) => [...p.stream, ...p.free].map((s) => s.id);

export type Ratings = {
	imdb: number | null;
	imdbVotes: number | null;
	rottenTomatoes: number | null;
	metacritic: number | null;
};

/** The page for a film or show. */
export const titlePath = (t: Pick<TitleSummary, 'kind' | 'id'>) => `/${t.kind}/${t.id}`;

/** Widths TMDB serves images at. */
export type ImageWidth = 'w92' | 'w185' | 'w342' | 'w500' | 'w780';

/** TMDB image, at one of its widths. */
export const imageUrl = (path: string, width: ImageWidth) =>
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
