<script lang="ts">
	import type { LayoutProps } from './$types';
	import { beforeNavigate, invalidateAll, onNavigate } from '$app/navigation';
	import { page, updated } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/instrument-sans';
	import font from '@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2?url';
	import display from '@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2?url';
	import './app.css';

	let { data, children }: LayoutProps = $props();

	const path = $derived(page.url.pathname);
	const tabs = $derived([
		{ href: '/', label: 'Watchlist', icon: 'watchlist', active: path === '/' },
		{ href: '/search', label: 'Search', icon: 'search', active: path === '/search' },
		{
			href: '/settings',
			label: 'Settings',
			icon: 'settings',
			active: ['/settings', '/services', '/notifications'].includes(path)
		}
	]);

	// A new version was deployed: load it fully on the next tap.
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});

	// Coming back to the app from the background: if a new version was deployed
	// meanwhile, load it straight away; otherwise reload the page's data, so it isn't
	// left showing what it had when the app was last open.
	async function onVisible() {
		if (document.visibilityState !== 'visible') return;
		if (await updated.check()) location.reload();
		else if (data.user) void invalidateAll();
	}

	// Pages crossfade into each other (app.css), where the browser can. The tabs stay put.
	onNavigate((navigation) => {
		if (!document.startViewTransition || navigation.to?.url.pathname === page.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="preload" href={font} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={display} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<svelte:document onvisibilitychange={onVisible} />

{@render children()}

{#if data.user}
	<!-- Each tab's code loads straight away, so the first tap only waits for data. -->
	<nav class="tabs" aria-label="Main" data-sveltekit-preload-code="eager">
		{#each tabs as tab (tab.href)}
			<a href={tab.href} class:active={tab.active} aria-current={tab.active ? 'page' : undefined}>
				<span class="icon">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						{#if tab.icon === 'watchlist'}
							<path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-4-6 4v-16a1 1 0 0 1 1-1Z" />
						{:else if tab.icon === 'search'}
							<circle cx="11" cy="11" r="6.5" />
							<path d="m16 16 4.5 4.5" />
						{:else}
							<circle cx="12" cy="12" r="3" />
							<path
								d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z"
							/>
						{/if}
					</svg>
				</span>
				<span class="label">{tab.label}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	/* Flush along the bottom, frosted; the page scrolls under it. The tab you're
	   on is lit in the accent, with a bar along its top edge. */
	nav {
		view-transition-name: tabs;
		position: fixed;
		inset: auto 0 0;
		height: calc(var(--tabs) + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		backdrop-filter: blur(20px) saturate(1.4);
		-webkit-backdrop-filter: blur(20px) saturate(1.4);
		border-top: 1px solid var(--line);
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	nav a {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--muted);
		text-decoration: none;
		transition: color 0.2s;
	}
	nav a::before {
		content: '';
		position: absolute;
		top: -1px;
		width: 32px;
		height: 3px;
		background: var(--accent);
		scale: 0 1;
		transition: scale 0.2s ease-out;
	}
	nav a.active::before {
		scale: 1;
	}
	.icon {
		position: relative;
		display: flex;
	}
	.icon svg {
		width: 24px;
		height: 24px;
		transition: scale 0.1s ease-out;
	}
	/* Pressed: the icon shrinks a little. */
	nav a:active .icon svg {
		scale: 0.85;
	}
	nav a.active {
		color: var(--accent);
	}
</style>
