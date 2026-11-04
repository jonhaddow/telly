// The Movie Database (TMDB): search, film and show details, trailers.
// https://developer.themoviedb.org/reference. Free for non-commercial use, with
// the credit on the settings page.
import { KINDS, type Kind, type Title, type TitleSummary } from '../titles.ts';

const BASE = 'https://api.themoviedb.org/3';

type Genre = { id: number; name: string };
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
	last_episode_to_air?: { runtime?: number | null } | null;
	status?: string;
	last_air_date?: string | null;
	number_of_seasons?: number;
	number_of_episodes?: number;
	imdb_id?: string | null;
	external_ids?: { imdb_id?: string | null };
	videos?: { results: Video[] };
	release_dates?: {
		results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
	};
	content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
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
	const youtube = videos
		.filter((v) => v.site === 'YouTube')
		.sort((a, b) => b.published_at.localeCompare(a.published_at));
	const rank = (v: Video) =>
		v.type === 'Trailer' ? (v.official ? 0 : 1) : v.type === 'Teaser' ? 2 : 3;
	const best = youtube.sort((a, b) => rank(a) - rank(b))[0];
	return best && rank(best) < 3 ? best.key : null;
}

function certificate(kind: Kind, t: RawTitle): string | null {
	if (kind === 'movie') {
		const gb = t.release_dates?.results.find((r) => r.iso_3166_1 === 'GB');
		return gb?.release_dates.find((d) => d.certification)?.certification ?? null;
	}
	return t.content_ratings?.results.find((r) => r.iso_3166_1 === 'GB')?.rating || null;
}

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
		seasons: kind === 'tv' ? (t.number_of_seasons ?? null) : null,
		episodes: kind === 'tv' ? (t.number_of_episodes ?? null) : null,
		imdbId: (kind === 'movie' ? t.imdb_id : t.external_ids?.imdb_id) || null,
		trailer: pickTrailer(t.videos?.results ?? [])
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
				kind === 'movie' ? 'videos,release_dates' : 'videos,content_ratings,external_ids';
			// Trailers in any language, so foreign films still have one.
			const data = await get<RawTitle>(`/${kind}/${id}`, {
				append_to_response: extra,
				include_video_language: 'en,null'
			});
			return data && toTitle(kind, data);
		}
	};
}
