<script lang="ts">
	import Poster from '#lib/components/Poster.svelte';
	import { imageUrl, titlePath } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** This page's address with a filter changed. */
	function href(change: { kind?: string | null; mine?: boolean }) {
		const kind = change.kind === undefined ? data.kind : change.kind;
		const mine = change.mine ?? data.mine;
		const q = [kind && `kind=${kind}`, mine && 'mine=1'].filter(Boolean).join('&');
		return q ? `/?${q}` : '/';
	}
	const kinds = [
		{ kind: null, label: 'All' },
		{ kind: 'movie', label: 'Films' },
		{ kind: 'tv', label: 'TV' }
	];
</script>

<svelte:head>
	<title>Watchlist · Telly</title>
</svelte:head>

<main class="page">
	<h1>Watchlist</h1>

	{#if !data.total}
		<section class="card empty">
			<p>Nothing here yet.</p>
			<p class="muted">Search for films and shows, and add them with <strong>+</strong>.</p>
			<a class="chip on" href="/search">Search</a>
		</section>
	{:else}
		<nav class="segments" aria-label="Show" data-sveltekit-reset="false">
			{#each kinds as k (k.label)}
				<a
					href={href({ kind: k.kind })}
					aria-current={data.kind === k.kind ? 'page' : undefined}
					data-sveltekit-replacestate>{k.label}</a
				>
			{/each}
		</nav>
		{#if data.hasServices}
			<div class="chips" data-sveltekit-reset="false">
				<a
					class="chip"
					class:on={data.mine}
					href={href({ mine: !data.mine })}
					aria-current={data.mine ? 'true' : undefined}
					data-sveltekit-replacestate>On our services</a
				>
			</div>
		{/if}

		{#if data.items.length}
			<ul class="grid">
				{#each data.items as t (`${t.kind}-${t.id}`)}
					<li>
						<a href={titlePath(t)}>
							<span class="poster">
								<Poster path={t.poster} name={t.name} />
								{#if t.on[0]?.logo}
									<img
										class="service"
										src={imageUrl(t.on[0].logo, 'w92')}
										alt=""
										title={t.on.map((s) => s.name).join(', ')}
									/>
								{/if}
							</span>
							<span class="name">{t.name}</span>
							{#if t.on.length}<span class="sr">, on {t.on.map((s) => s.name).join(', ')}</span
								>{/if}
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">Nothing matches.</p>
		{/if}

		{#if !data.hasServices}
			<p class="note">
				<a href="/services">Pick your streaming services</a> to see what you can watch for free.
			</p>
		{/if}
	{/if}
</main>

<style>
	.empty {
		padding: 24px 20px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px 12px;
	}
	@media (min-width: 960px) {
		.grid {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
	.grid a {
		display: flex;
		flex-direction: column;
		gap: 6px;
		text-decoration: none;
	}
	.grid a:active .poster {
		scale: 0.97;
	}
	.poster {
		position: relative;
		transition: scale 0.1s;
	}
	/* The first of our services that shows it, in the corner. */
	.service {
		position: absolute;
		left: 6px;
		bottom: 6px;
		width: 28px;
		height: 28px;
		border-radius: 7px;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.35);
	}
	.name {
		font-size: 13px;
		font-weight: 700;
		line-height: 1.25;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
