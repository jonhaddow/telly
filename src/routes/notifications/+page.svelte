<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	type State = 'loading' | 'unsupported' | 'install-first' | 'blocked' | 'off' | 'on';
	let status = $state<State>('loading');
	let busy = $state(false);
	let message = $state<string | null>(null);

	function keyBytes(base64url: string) {
		const b64 = base64url.replaceAll('-', '+').replaceAll('_', '/');
		return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (c) =>
			c.charCodeAt(0)
		);
	}

	async function refresh() {
		const standalone =
			matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			status = ios && !standalone ? 'install-first' : 'unsupported';
			return;
		}
		if (Notification.permission === 'denied') {
			status = 'blocked';
			return;
		}
		const reg = await navigator.serviceWorker.ready;
		status = (await reg.pushManager.getSubscription()) ? 'on' : 'off';
	}

	onMount(() => {
		refresh().catch(() => (status = 'unsupported'));
	});

	async function turnOn() {
		if (!data.vapidPublicKey) return;
		busy = true;
		message = null;
		try {
			// Must run straight from the tap: iOS only asks for permission then.
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				status = permission === 'denied' ? 'blocked' : 'off';
				return;
			}
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: keyBytes(data.vapidPublicKey)
			});
			const res = await fetch('/push/subscribe', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(sub.toJSON())
			});
			if (!res.ok) throw new Error(`Server said ${res.status}`);
			status = 'on';
			message = 'Notifications are on for this device.';
		} catch (e) {
			message = `Couldn’t turn notifications on: ${(e as Error).message}`;
		} finally {
			busy = false;
		}
	}

	async function turnOff() {
		busy = true;
		message = null;
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				await fetch('/push/unsubscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ endpoint: sub.endpoint })
				});
				await sub.unsubscribe();
			}
			status = 'off';
			message = 'Notifications are off for this device.';
		} finally {
			busy = false;
		}
	}

	async function test() {
		busy = true;
		message = null;
		try {
			const res = await fetch('/push/test', {
				method: 'POST',
				headers: { 'content-type': 'application/json' }
			});
			const r = (await res.json()) as { sent?: number };
			message = r.sent
				? 'Sent. It should arrive in a few seconds.'
				: 'Nothing was sent; try turning notifications off and on.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Notifications · Telly</title>
</svelte:head>

<main class="page">
	<a class="back" href="/settings">Settings</a>
	<h1>Notifications</h1>

	{#if message}<p class="note" role="status">{message}</p>{/if}

	<section class="card block">
		<p class="muted">
			A notification when a new episode is out, or something on your watchlist arrives on one of
			your services. This is set for each device separately.
		</p>
		{#if !data.vapidPublicKey}
			<p>Notifications aren’t set up on this server yet.</p>
		{:else if status === 'loading'}
			<p class="muted">Checking…</p>
		{:else if status === 'install-first'}
			<p>
				On iPhone, add the app to your Home Screen first: in Safari tap <strong>Share</strong> →
				<strong>Add to Home Screen</strong>, then open it from there and come back here.
			</p>
		{:else if status === 'unsupported'}
			<p>This browser doesn’t support notifications.</p>
		{:else if status === 'blocked'}
			<p>
				Notifications are blocked for this app. On iPhone: Settings → Notifications → Telly → Allow
				Notifications.
			</p>
		{:else if status === 'off'}
			<Button class="w-full" onclick={turnOn} disabled={busy}>
				{busy ? 'Turning on…' : 'Turn on notifications'}
			</Button>
		{:else}
			<p><strong>On</strong> for this device.</p>
			<div class="row">
				<Button variant="outline" onclick={test} disabled={busy}>Send a test</Button>
				<Button variant="secondary" onclick={turnOff} disabled={busy}>Turn off</Button>
			</div>
		{/if}
	</section>
</main>

<style>
	.block {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	.note {
		background: var(--note-bg);
		color: var(--note-ink);
		border-radius: var(--radius);
		padding: 12px 14px;
		font-size: 15px;
	}
</style>
