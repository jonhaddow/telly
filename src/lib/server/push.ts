import { buildPushPayload } from '@block65/webcrypto-web-push';
import { eq } from 'drizzle-orm';
import { pushSubscription } from './db/schema.ts';
import type { DB } from './db/index.ts';

export type PushPayload = {
	title: string;
	body: string;
	/** Where tapping the notification goes. */
	url: string;
	/** The app icon's badge number (the inbox count). */
	badge: number;
	/** Notifications with the same tag replace each other instead of stacking. */
	tag?: string;
};

export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Push services Apple, Google, Mozilla and Microsoft use; anything else is refused. */
const PUSH_HOSTS = [
	/\.push\.apple\.com$/,
	/^fcm\.googleapis\.com$/,
	/\.googleapis\.com$/,
	/\.push\.services\.mozilla\.com$/,
	/\.notify\.windows\.com$/
];

export function validSubscription(input: unknown): input is SubscriptionInput {
	const s = input as SubscriptionInput;
	if (
		typeof s?.endpoint !== 'string' ||
		typeof s.keys?.p256dh !== 'string' ||
		typeof s.keys?.auth !== 'string'
	)
		return false;
	try {
		const url = new URL(s.endpoint);
		return url.protocol === 'https:' && PUSH_HOSTS.some((h) => h.test(url.hostname));
	} catch {
		return false;
	}
}

export async function saveSubscription(db: DB, userId: number, s: SubscriptionInput) {
	const row = {
		endpoint: s.endpoint,
		p256dh: s.keys.p256dh,
		auth: s.keys.auth,
		userId,
		createdAt: new Date().toISOString()
	};
	await db
		.insert(pushSubscription)
		.values(row)
		.onConflictDoUpdate({ target: pushSubscription.endpoint, set: row });
}

export async function removeSubscription(db: DB, endpoint: string) {
	await db.delete(pushSubscription).where(eq(pushSubscription.endpoint, endpoint));
}

export type PushConfig = {
	/** VAPID public key: base64url, uncompressed P-256 point (the browser uses it too). */
	publicKey: string;
	/** VAPID private key: base64url `d` value. */
	privateKey: string;
	/** Contact for push services, as a URL or mailto:. */
	subject: string;
	fetcher?: typeof fetch;
};

/**
 * Sends a notification to every subscribed device (optionally just one
 * person's). Devices the push service says are gone are forgotten.
 */
export async function notify(db: DB, cfg: PushConfig, payload: PushPayload, userId?: number) {
	const fetcher = cfg.fetcher ?? fetch;
	const subs = await db
		.select()
		.from(pushSubscription)
		.where(userId === undefined ? undefined : eq(pushSubscription.userId, userId));

	const results = await Promise.all(
		subs.map(async (s) => {
			try {
				const req = await buildPushPayload(
					{ data: payload, options: { ttl: 6 * 3600, urgency: 'normal' } },
					{ endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
					{ subject: cfg.subject, publicKey: cfg.publicKey, privateKey: cfg.privateKey }
				);
				const res = await fetcher(s.endpoint, req);
				if (res.status === 404 || res.status === 410) {
					await removeSubscription(db, s.endpoint);
					return 'expired' as const;
				}
				if (!res.ok) console.error('Push failed', res.status, await res.text().catch(() => ''));
				return res.ok ? ('sent' as const) : ('failed' as const);
			} catch (e) {
				console.error('Push failed', e);
				return 'failed' as const;
			}
		})
	);
	return {
		sent: results.filter((r) => r === 'sent').length,
		expired: results.filter((r) => r === 'expired').length,
		failed: results.filter((r) => r === 'failed').length
	};
}
