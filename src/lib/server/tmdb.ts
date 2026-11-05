// The Movie Database (TMDB): search, film and show details, trailers, and
// where to watch (JustWatch's data).
// https://developer.themoviedb.org/reference. Free for non-commercial use, with
// the credit on the settings page.
import {
	KINDS,
	type Episode,
	type Kind,
	type Provider,
	type Providers,
	type Title,
	type TitleSummary
} from '../titles.ts';

const BASE = 'https://api.themoviedb.org/3';

type Genre = { id: number; name: string };
type RawSeason = {
	season_number: number;
	name?: string;
	episode_count?: number;
	air_date?: string | null;
};
export type RawEpisode = {
	season_number: number;
	episode_number: number;
	name?: string;
	air_date?: string | null;
	runtime?: number | null;
	still_path?: string | null;
	overview?: string;
};
type RawProvider = {
	provider_id: number;
	provider_name: string;
	logo_path?: string | null;
	display_priority?: number;
	display_priorities?: Record<string, number>;
};
type RawProviders = {
	link?: string;
	flatrate?: RawProvider[];
	free?: RawProvider[];
	ads?: RawProvider[];
	rent?: RawProvider[];
	buy?: RawProvider[];
};
type Video = { key: string; site: string; type: string; official: boolean; published_at: string };

/** The parts of TMDB's responses the app reads. */
export type RawSummary = {
	id: number;
	media_type?: string;
	title?: string;
	name?: string;
	release_date?: string;
	first_air_date?: string;
	poster_path?: string | null;
};

export type RawTitle = RawSummary & {
	overview?: string;
	tagline?: string;
	backdrop_path?: string | null;
	genres?: Genre[];
	runtime?: number | null;
	episode_run_time?: number[];
	last_episode_to_air?: (Partial<RawEpisode> & { runtime?: number | null }) | null;
	status?: string;
	last_air_date?: string | null;
	seasons?: RawSeason[];
	imdb_id?: string | null;
	external_ids?: { imdb_id?: string | null };
	videos?: { results: Video[] };
	release_dates?: {
		results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
	};
	content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
	'watch/providers'?: { results: Record<string, RawProviders> };
};

const year = (date?: string | null) => (date ? date.slice(0, 4) : null);

/** Shows that are finished: "2019–2023". Anything else still running: "2019–". */
const ENDED = new Set(['Ended', 'Canceled']);

function years(kind: Kind, t: RawTitle): string | null {
	if (kind === 'movie') return year(t.release_date);
	const start = year(t.first_air_date);
	if (!start || !t.status) return start;
	if (!ENDED.has(t.status)) return `${start}–`;
	const end = year(t.last_air_date);
	return end && end !== start ? `${start}–${end}` : start;
}

export function toSummary(kind: Kind, t: RawSummary): TitleSummary {
	return {
		kind,
		id: t.id,
		name: (kind === 'movie' ? t.title : t.name) ?? 'Untitled',
		years: years(kind, t),
		poster: t.poster_path ?? null
	};
}

/** The official trailer if there is one, else any trailer, else a teaser. Newest first. */
export function pickTrailer(videos: Video[]): string | null {
	const rank = (v: Video) => (v.type === 'Trailer' ? (v.official ? 0 : 1) : 2);
	const best = videos
		.filter((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
		.sort((a, b) => rank(a) - rank(b) || b.published_at.localeCompare(a.published_at))[0];
	return best?.key ?? null;
}

function certificate(kind: Kind, t: RawTitle): string | null {
	if (kind === 'movie') {
		const gb = t.release_dates?.results.find((r) => r.iso_3166_1 === 'GB');
		return gb?.release_dates.find((d) => d.certification)?.certification ?? null;
	}
	return t.content_ratings?.results.find((r) => r.iso_3166_1 === 'GB')?.rating || null;
}

const toProvider = (p: RawProvider): Provider => ({
	id: p.provider_id,
	name: p.provider_name,
	logo: p.logo_path ?? null
});

/** Each service once, by the given priority (JustWatch's: most popular first). */
function ranked(list: RawProvider[], priority: (p: RawProvider) => number | undefined) {
	const seen = new Set<number>();
	return list
		.toSorted((a, b) => (priority(a) ?? 999) - (priority(b) ?? 999))
		.filter((p) => !seen.has(p.provider_id) && seen.add(p.provider_id))
		.map(toProvider);
}

const merge = (...lists: (RawProvider[] | undefined)[]) =>
	ranked(
		lists.flatMap((l) => l ?? []),
		(p) => p.display_priority
	);

/** UK where-to-watch. A service in more than one group shows in the cheapest only. */
export function toProviders(raw: RawProviders | undefined): Providers {
	const taken = new Set<number>();
	const unseen = (list: Provider[]) => list.filter((p) => !taken.has(p.id) && taken.add(p.id));
	return {
		link: raw?.link ?? null,
		stream: unseen(merge(raw?.flatrate)),
		free: unseen(merge(raw?.free, raw?.ads)),
		buy: unseen(merge(raw?.rent, raw?.buy))
	};
}

/** Amazon and Apple's add-on channels: the service itself is listed too. */
const isChannel = (name: string) => name.endsWith(' Channel');

/** Rent-or-buy shops: no one subscribes to these. */
const SHOPS = new Set([
	'Amazon Video',
	'Apple TV Store',
	'Google Play Movies',
	'Microsoft Store',
	'Rakuten TV',
	'Sky Store',
	'YouTube',
	'Chili'
]);

export const toEpisode = (e: RawEpisode): Episode => ({
	season: e.season_number,
	number: e.episode_number,
	name: e.name || `Episode ${e.episode_number}`,
	airDate: e.air_date || null,
	runtime: e.runtime || null,
	still: e.still_path ?? null,
	overview: e.overview ?? ''
});

export function toTitle(kind: Kind, t: RawTitle): Title {
	return {
		...toSummary(kind, t),
		overview: t.overview ?? '',
		tagline: t.tagline || null,
		backdrop: t.backdrop_path ?? null,
		genres: (t.genres ?? []).map((g) => g.name),
		runtime:
			(kind === 'movie'
				? t.runtime
				: (t.episode_run_time?.[0] ?? t.last_episode_to_air?.runtime)) || null,
		certificate: certificate(kind, t),
		seasons: (t.seasons ?? [])
			.filter((s) => s.season_number > 0 && s.episode_count)
			.sort((a, b) => a.season_number - b.season_number)
			.map((s) => ({
				number: s.season_number,
				name: s.name || `Season ${s.season_number}`,
				episodes: s.episode_count ?? 0,
				airDate: s.air_date || null
			})),
		imdbId: (kind === 'movie' ? t.imdb_id : t.external_ids?.imdb_id) || null,
		trailer: pickTrailer(t.videos?.results ?? []),
		providers: toProviders(t['watch/providers']?.results?.GB),
		// Not specials (season 0).
		latest:
			kind === 'tv' && t.last_episode_to_air?.season_number && t.last_episode_to_air.episode_number
				? toEpisode(t.last_episode_to_air as RawEpisode)
				: null
	};
}

export type Tmdb = ReturnType<typeof tmdb>;

/** A TMDB client for the API Read Access Token. */
export function tmdb(token: string, fetcher: typeof fetch = fetch) {
	async function get<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
		const url = new URL(BASE + path);
		url.search = new URLSearchParams({ language: 'en-GB', ...params }).toString();
		const res = await fetcher(url, {
			headers: { authorization: `Bearer ${token}`, accept: 'application/json' }
		});
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`TMDB ${path}: ${res.status}`);
		return res.json() as Promise<T>;
	}

	return {
		/** Films and shows matching the words, in TMDB's order (people are left out). */
		async search(query: string): Promise<TitleSummary[]> {
			const data = await get<{ results: RawSummary[] }>('/search/multi', {
				query,
				include_adult: 'false'
			});
			return (data?.results ?? [])
				.filter((r): r is RawSummary & { media_type: Kind } => KINDS.includes(r.media_type as Kind))
				.map((r) => toSummary(r.media_type, r));
		},

		/** A film or show, or null if TMDB has no such id. */
		async title(kind: Kind, id: number): Promise<Title | null> {
			const extra =
				(kind === 'movie' ? 'videos,release_dates' : 'videos,content_ratings,external_ids') +
				// Every country's (about 40 KB for a popular show): still cheaper than a second call.
				',watch/providers';
			// Trailers in any language, so foreign films still have one.
			const data = await get<RawTitle>(`/${kind}/${id}`, {
				append_to_response: extra,
				include_video_language: 'en,null'
			});
			return data && toTitle(kind, data);
		},

		/** A season's episodes in order, or null if there's no such season. */
		async season(showId: number, season: number): Promise<Episode[] | null> {
			const data = await get<{ episodes?: RawEpisode[] }>(`/tv/${showId}/season/${season}`);
			return data && (data.episodes ?? []).map(toEpisode);
		},

		/** UK streaming services, most popular first, without add-on channels or shops. */
		async services(): Promise<Provider[]> {
			const lists = await Promise.all(
				KINDS.map((k) =>
					get<{ results: RawProvider[] }>(`/watch/providers/${k}`, { watch_region: 'GB' })
				)
			);
			return ranked(
				lists
					.flatMap((l) => l?.results ?? [])
					.filter((p) => !isChannel(p.provider_name) && !SHOPS.has(p.provider_name)),
				(p) => p.display_priorities?.GB
			);
		}
	};
}
