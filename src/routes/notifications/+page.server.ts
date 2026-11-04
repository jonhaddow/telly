import { env } from 'cloudflare:workers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	vapidPublicKey: env.VAPID_PUBLIC_KEY ?? null
});
