<script lang="ts">
	import EpisodeCheck from '#lib/components/EpisodeCheck.svelte';
	import Poster from '#lib/components/Poster.svelte';
	import { episodeCode, imageUrl, titlePath } from '#lib/titles.ts';
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

	{#if data.upNext.length}
		<section class="up-next" aria-labelledby="up-next">
			<h2 id="up-next">Up next</h2>
			<ul class="list">
				{#each data.upNext as e (e.id)}
					<li>
						<a href="/tv/{e.id}">
							<span class="thumb">
								{#if e.still}
									<img src={imageUrl(e.still, 'w185')} alt="" loading="lazy" />
								{:else}
									<Poster path={e.poster} name={e.name} width="w92" />
								{/if}
							</span>
							<span class="text">
								<strong>{e.name}</strong>
								<span class="muted">{episodeCode(e)} · {e.episodeName}</span>
							</span>
						</a>
						<EpisodeCheck show={e.id} season={e.season} episode={e.number} watched={false} />
					</li>
				{/each}
			</ul>
		</section>
	{/if}

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
	.up-next {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.up-next li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-right: 12px;
	}
	.up-next a {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0 10px 12px;
		text-decoration: none;
	}
	/* An episode still (16:9), or the show's poster in its place. */
	.thumb {
		flex: none;
		width: 96px;
		aspect-ratio: 16 / 9;
		border-radius: 8px;
		overflow: hidden;
		background: var(--poster);
		display: flex;
		justify-content: center;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumb :global(.poster) {
		height: 100%;
		border-radius: 0;
	}
	.up-next .text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.up-next .muted {
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
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
