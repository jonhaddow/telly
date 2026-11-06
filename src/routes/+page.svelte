<script lang="ts">
	import EpisodeCheck from '#lib/components/EpisodeCheck.svelte';
	import Poster from '#lib/components/Poster.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { episodeCode, imageUrl, titlePath } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** This page's address with filters changed (null clears one). */
	function href(change: Record<string, string | null>) {
		const all = { ...Object.fromEntries(page.url.searchParams), ...change };
		// Seen has no service or rent filters.
		if (all.list) all.mine = all.rent = null;
		const q = Object.entries(all)
			.filter((e): e is [string, string] => !!e[1])
			.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
			.join('&');
		return q ? `/?${q}` : '/';
	}
	const toggle = (name: string, on: boolean) => href({ [name]: on ? null : '1' });
	const lists = [
		{ list: null, label: 'Watchlist' },
		{ list: 'seen', label: 'Seen' }
	];
	const kinds = [
		{ kind: null, label: 'All' },
		{ kind: 'movie', label: 'Films' },
		{ kind: 'tv', label: 'TV' }
	];
</script>

<svelte:head>
	<title>{data.seen ? 'Seen' : 'Watchlist'} · Telly</title>
</svelte:head>

<main class="page">
	<nav class="lists" aria-label="Lists" data-sveltekit-reset="false">
		{#each lists as l (l.label)}
			{#if !!l.list === data.seen}
				<h1>{l.label}</h1>
			{:else}
				<a href={href({ list: l.list })} data-sveltekit-replacestate>{l.label}</a>
			{/if}
		{/each}
	</nav>

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

	{#if !data.total && data.seen}
		<section class="card empty">
			<p>Nothing seen yet.</p>
			<p class="muted">Films go here when you mark them seen, shows once you're caught up.</p>
		</section>
	{:else if !data.total}
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
		<div class="chips" data-sveltekit-reset="false">
			{#if data.on}
				<a
					class="chip on"
					href={href({ on: null })}
					aria-label="On {data.on.name}: show all"
					data-sveltekit-replacestate>On {data.on.name} ✕</a
				>
			{/if}
			{#if data.hasServices && !data.seen}
				<a
					class="chip"
					class:on={data.mine}
					href={toggle('mine', data.mine)}
					aria-current={data.mine ? 'true' : undefined}
					data-sveltekit-replacestate>On our services</a
				>
			{/if}
			{#if !data.seen}
				<a
					class="chip"
					class:on={data.rent}
					href={toggle('rent', data.rent)}
					aria-current={data.rent ? 'true' : undefined}
					data-sveltekit-replacestate>To rent</a
				>
			{/if}
			{#if data.genres.length}
				<label class="chip genre" class:on={data.genre}>
					<span>{data.genre ?? 'Genre'} ▾</span>
					<select
						aria-label="Genre"
						value={data.genre ?? ''}
						onchange={(e) =>
							goto(href({ genre: e.currentTarget.value }), {
								replace: true,
								reset: false
							})}
					>
						<option value="">Any genre</option>
						{#each data.genres as g (g)}
							<option value={g}>{g}</option>
						{/each}
					</select>
				</label>
			{/if}
		</div>

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

		{#if !data.hasServices && !data.seen}
			<p class="note">
				<a href="/services">Pick your streaming services</a> to see what you can watch for free.
			</p>
		{/if}
	{/if}
</main>

<style>
	/* The phone's own picker, under a chip. */
	.genre select {
		position: absolute;
		inset: 0;
		width: 100%;
		margin: 0;
		opacity: 0;
		font-size: 16px;
		cursor: pointer;
	}
	.genre:has(select:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	/* Watchlist and Seen: this one's the heading, the other dimmed beside it. */
	.lists {
		display: flex;
		align-items: baseline;
		gap: 20px;
	}
	.lists a {
		font: 800 46px/0.95 var(--display);
		text-transform: uppercase;
		text-decoration: none;
		opacity: 0.35;
	}
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
		border-radius: var(--radius-sm);
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
		border-radius: var(--radius-sm);
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
