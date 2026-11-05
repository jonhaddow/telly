import type { DB } from '#lib/server/db/index.ts';
import type { SessionUser } from '#lib/server/auth.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			db: DB;
			user: SessionUser | null;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

declare global {
	namespace Cloudflare {
		interface Env {
			/** Google OAuth client (wrangler.jsonc vars; .dev.vars locally). */
			GOOGLE_CLIENT_ID: string;
			/** Worker secret: `wrangler secret put GOOGLE_CLIENT_SECRET`. */
			GOOGLE_CLIENT_SECRET: string;
			/** Authenticates the hourly cron's call to /check. */
			CRON_SECRET?: string;
			/** Worker secret: TMDB's API Read Access Token. */
			TMDB_TOKEN?: string;
			/** Worker secret: OMDb API key (ratings are left off without it). */
			OMDB_KEY?: string;
			/** Web push (VAPID) public key, base64url; the private key is a Worker secret. */
			VAPID_PUBLIC_KEY?: string;
			VAPID_PRIVATE_KEY?: string;
			/** e.g. https://telly.app.haddow.me . */
			APP_ORIGIN?: string;
		}
	}
}

export {};
