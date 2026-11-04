<script lang="ts">
	import type { LayoutProps } from './$types';
	import { beforeNavigate, invalidateAll, onNavigate } from '$app/navigation';
	import { page, updated } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/figtree';
	import font from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
	import './app.css';

	let { data, children }: LayoutProps = $props();

	const path = $derived(page.url.pathname);
	const tabs = $derived([
		{
			href: '/search',
			label: 'Search',
			icon: 'search',
			active: path !== '/settings' && path !== '/notifications'
		},
		{
			href: '/settings',
			label: 'Settings',
			icon: 'settings',
			active: path === '/settings' || path === '/notifications'
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
						{#if tab.icon === 'search'}
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
	/* A floating, frosted pill; the page scrolls under it. */
	nav {
		view-transition-name: tabs;
		position: fixed;
		left: 50%;
		bottom: calc(12px + env(safe-area-inset-bottom));
		translate: -50% 0;
		width: min(calc(100% - 32px), 260px);
		height: var(--tabs);
		padding: 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--card) 78%, transparent);
		backdrop-filter: blur(20px) saturate(1.6);
		-webkit-backdrop-filter: blur(20px) saturate(1.6);
		border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
		box-shadow: 0 8px 28px rgb(0 0 0 / 0.12);
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 700;
		color: var(--muted);
		text-decoration: none;
		transition:
			background-color 0.2s,
			color 0.2s;
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
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
</style>
