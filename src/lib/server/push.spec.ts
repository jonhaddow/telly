import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from './test-db.ts';
import * as schema from './db/schema.ts';
import type { DB } from './db/index.ts';
import { notify, saveSubscription, validSubscription, type PushConfig } from './push.ts';

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
	btoa(String.fromCharCode(...new Uint8Array(bytes)))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '');

/** A subscription like a browser would make: its own P-256 key and auth secret. */
async function browserSubscription(endpoint: string) {
	const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveBits'
	])) as CryptoKeyPair;
	return {
		endpoint,
		keys: {
			p256dh: b64url(await crypto.subtle.exportKey('raw', pair.publicKey)),
			auth: b64url(crypto.getRandomValues(new Uint8Array(16)))
		}
	};
}

let db: DB;
let alex: number;
let sam: number;
let cfg: PushConfig;
let sent: { url: string; headers: Headers }[];
let respond: (url: string) => number;

beforeEach(async () => {
	db = await testDb();
	[{ id: alex }, { id: sam }] = await db
		.insert(schema.user)
		.values([
			{ email: 'a@x', name: 'Alex' },
			{ email: 's@x', name: 'Sam' }
		])
		.returning();
	const vapid = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign'
	])) as CryptoKeyPair;
	sent = [];
	respond = () => 201;
	const jwk = await crypto.subtle.exportKey('jwk', vapid.privateKey);
	cfg = {
		publicKey: b64url(await crypto.subtle.exportKey('raw', vapid.publicKey)),
		privateKey: jwk.d!,
		subject: 'https://telly.example',
		fetcher: (async (input: string | URL | Request, init?: RequestInit) => {
			sent.push({ url: String(input), headers: new Headers(init?.headers) });
			return new Response(null, { status: respond(String(input)) });
		}) as typeof fetch
	};
});

const payload = { title: 'New episode', body: 'Harbour Lights S3E4', url: '/', badge: 3 };

describe('validSubscription', () => {
	it('accepts real push services only', async () => {
		expect(validSubscription(await browserSubscription('https://web.push.apple.com/abc'))).toBe(
			true
		);
		expect(
			validSubscription(await browserSubscription('https://fcm.googleapis.com/fcm/send/abc'))
		).toBe(true);
		expect(validSubscription(await browserSubscription('https://evil.example/abc'))).toBe(false);
		expect(validSubscription({ endpoint: 'https://web.push.apple.com/x' })).toBe(false);
	});
});

describe('notify', () => {
	it('sends an encrypted, signed push to every device', async () => {
		await saveSubscription(
			db,
			alex,
			await browserSubscription('https://web.push.apple.com/alex-phone')
		);
		await saveSubscription(
			db,
			sam,
			await browserSubscription('https://web.push.apple.com/sam-phone')
		);
		expect(await notify(db, cfg, payload)).toEqual({ sent: 2, expired: 0, failed: 0 });
		expect(sent.map((s) => s.url).sort()).toEqual([
			'https://web.push.apple.com/alex-phone',
			'https://web.push.apple.com/sam-phone'
		]);
		expect(sent[0].headers.get('content-encoding')).toBe('aes128gcm');
		expect(sent[0].headers.get('authorization')).toMatch(/^vapid t=.+, k=.+/);
	});

	it('can target one person', async () => {
		await saveSubscription(
			db,
			alex,
			await browserSubscription('https://web.push.apple.com/alex-phone')
		);
		await saveSubscription(
			db,
			sam,
			await browserSubscription('https://web.push.apple.com/sam-phone')
		);
		await notify(db, cfg, payload, alex);
		expect(sent.map((s) => s.url)).toEqual(['https://web.push.apple.com/alex-phone']);
	});

	it('forgets devices the push service says are gone', async () => {
		await saveSubscription(
			db,
			alex,
			await browserSubscription('https://web.push.apple.com/old-phone')
		);
		await saveSubscription(
			db,
			alex,
			await browserSubscription('https://web.push.apple.com/new-phone')
		);
		respond = (url) => (url.endsWith('old-phone') ? 410 : 201);
		expect(await notify(db, cfg, payload)).toEqual({ sent: 1, expired: 1, failed: 0 });
		expect((await db.select().from(schema.pushSubscription)).map((s) => s.endpoint)).toEqual([
			'https://web.push.apple.com/new-phone'
		]);
	});

	it('re-subscribing the same device updates it rather than duplicating', async () => {
		await saveSubscription(db, alex, await browserSubscription('https://web.push.apple.com/phone'));
		await saveSubscription(db, sam, await browserSubscription('https://web.push.apple.com/phone'));
		const rows = await db.select().from(schema.pushSubscription);
		expect(rows).toHaveLength(1);
		expect(rows[0].userId).toBe(sam);
	});
});
