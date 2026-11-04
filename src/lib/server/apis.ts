import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import { tmdb } from './tmdb.ts';

/**
 * TMDB and OMDb for this request. Local development and the end-to-end tests
 * use made-up stand-ins (fake-apis.ts) unless .dev.vars has a TMDB token and
 * FAKE_APIS isn't set.
 */
export async function apis() {
	if (dev && (process.env.FAKE_APIS || !env.TMDB_TOKEN)) {
		const { fakeFetch } = await import('./fake-apis.ts');
		return { tmdb: tmdb('fake', fakeFetch), omdbKey: 'fake', fetcher: fakeFetch };
	}
	// Unbound: Workers' fetch throws "Illegal invocation" when called as a method.
	const fetcher: typeof fetch = (input, init) => fetch(input, init);
	return { tmdb: tmdb(env.TMDB_TOKEN ?? '', fetcher), omdbKey: env.OMDB_KEY, fetcher };
}
