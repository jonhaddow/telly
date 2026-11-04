import { env } from 'cloudflare:workers';
import type { PushConfig } from './push.ts';

/** Push settings for this deployment, or null if VAPID keys aren't set. */
export function pushConfig(): PushConfig | null {
	const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, APP_ORIGIN } = env;
	if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return null;
	return {
		publicKey: VAPID_PUBLIC_KEY,
		privateKey: VAPID_PRIVATE_KEY,
		subject: APP_ORIGIN ?? 'https://telly.app.haddow.me'
	};
}
