// Service worker: shows push notifications, keeps the app icon's badge in step,
// and opens the right screen when a notification is tapped.
// It caches only the built app's code, CSS and font (their names change with
// every build, so they can't go stale); pages and data always come from the
// network, so the numbers are always fresh.
import { version } from '$app/env';
import { immutable } from '$app/manifest';
import { self } from '$app/service-worker';

const CACHE = `app-${version}`;
const BUILT = new Set(immutable.map((f) => new URL(f.path, self.location.origin).pathname));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
	event.waitUntil(
		(async () => {
			// Earlier builds' files are gone from the server too.
			for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
			await self.clients.claim();
		})()
	)
);

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
	if (!BUILT.has(url.pathname)) return;
	// Kept the first time each is used.
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const hit = await cache.match(event.request);
			if (hit) return hit;
			const response = await fetch(event.request);
			if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
			return response;
		})()
	);
});

type Payload = { title: string; body: string; url: string; badge: number; tag?: string };

async function setBadge(count: number) {
	const nav = self.navigator as {
		setAppBadge?(n: number): Promise<void>;
		clearAppBadge?(): Promise<void>;
	};
	try {
		if (count > 0) await nav.setAppBadge?.(count);
		else await nav.clearAppBadge?.();
	} catch {
		// Badging isn't supported everywhere.
	}
}

self.addEventListener('push', (event) => {
	const data = (event.data?.json() ?? {}) as Partial<Payload>;
	event.waitUntil(
		Promise.all([
			self.registration.showNotification(data.title ?? 'Telly', {
				body: data.body ?? '',
				icon: '/icon-192.png',
				tag: data.tag,
				data: { url: data.url ?? '/' }
			}),
			setBadge(data.badge ?? 0)
		])
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL(
		(event.notification.data as { url?: string } | null)?.url ?? '/',
		self.location.origin
	).href;
	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const open = windows.find(
				(w: { url: string }) => new URL(w.url).origin === self.location.origin
			);
			if (open) {
				// Navigate first: focusing fires the layout's version check, whose
				// reload would cancel the navigation.
				const client = await open.navigate(url);
				return (client ?? open).focus();
			}
			return self.clients.openWindow(url);
		})()
	);
});
