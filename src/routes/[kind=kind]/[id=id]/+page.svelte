<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { stay } from '#lib/forms.ts';
	import Poster from '#lib/components/Poster.svelte';
	import ShowEpisodes from '#lib/components/ShowEpisodes.svelte';
	import WhereToWatch from '#lib/components/WhereToWatch.svelte';
	import { formatRuntime, formatVotes, imageUrl } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = $derived(data.title);

	const facts = $derived(
		[
			t.kind === 'movie' ? 'Film' : 'TV',
			t.years,
			t.seasons.length ? `${t.seasons.length} season${t.seasons.length === 1 ? '' : 's'}` : null,
			t.runtime ? formatRuntime(t.runtime) : null
		].filter(Boolean)
	);

	// Back to wherever you came from in the app (search results keep their words);
	// opened from a link or a notification, to search.
	let fromApp = false;
	afterNavigate(({ from }) => (fromApp = !!from));
	function back(e: MouseEvent) {
		if (!fromApp) return;
		e.preventDefault();
		history.back();
	}
</script>

<svelte:head>
	<title>{t.name} · Telly</title>
</svelte:head>

{#if t.backdrop}
	<div class="backdrop" aria-hidden="true">
		<img src={imageUrl(t.backdrop, 'w780')} alt="" />
	</div>
{/if}

<main class="page" class:over-backdrop={!!t.backdrop}>
	<a class="back" href="/search" onclick={back}>‹ Back</a>

	<header>
		<div class="poster"><Poster path={t.poster} name={t.name} width="w342" /></div>
		<div class="heading">
			<h1>{t.name}</h1>
			<p class="muted facts">
				{facts.join(' · ')}
				{#if t.certificate}<span class="cert">{t.certificate}</span>{/if}
			</p>
			{#if t.genres.length}
				<p class="muted genres">{t.genres.join(', ')}</p>
			{/if}
		</div>
	</header>

	<form method="POST" action={data.listed ? '?/remove' : '?/add'} use:enhance={stay}>
		<input type="hidden" name="kind" value={t.kind} />
		<input type="hidden" name="id" value={t.id} />
		<button class="listed" class:on={data.listed}>
			{data.listed ? '✓ On the watchlist' : '+ Add to watchlist'}
		</button>
	</form>

	{#if t.imdbId}
		<section class="ratings" aria-label="Ratings">
			{#await data.ratings}
				<span class="score loading">IMDb …</span>
			{:then r}
				{#if r?.imdb != null}
					<a class="score imdb" href="https://www.imdb.com/title/{t.imdbId}/">
						<span class="source">IMDb</span>
						<strong>{r.imdb.toFixed(1)}</strong>
						{#if r.imdbVotes}<span class="votes">{formatVotes(r.imdbVotes)}</span>{/if}
					</a>
				{/if}
				{#if r?.rottenTomatoes != null}
					<span class="score">
						<span class="source">Rotten Tomatoes</span>
						<strong>{r.rottenTomatoes}%</strong>
					</span>
				{/if}
				{#if r?.metacritic != null}
					<span class="score">
						<span class="source">Metacritic</span>
						<strong>{r.metacritic}</strong>
					</span>
				{/if}
			{/await}
		</section>
	{/if}

	{#if t.seasons.length}
		<ShowEpisodes
			show={t.id}
			seasons={t.seasons}
			watchedBySeason={data.watchedBySeason}
			watchedAny={data.watchedAny}
			next={data.next}
		/>
	{/if}

	<WhereToWatch providers={t.providers} ours={data.ours} />

	{#if t.trailer}
		<a class="trailer" href="https://www.youtube.com/watch?v={t.trailer}">
			<img src="https://i.ytimg.com/vi/{t.trailer}/mqdefault.jpg" alt="" loading="lazy" />
			<span class="play">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5Z" /></svg>
				Watch the trailer
			</span>
		</a>
	{/if}

	{#if t.tagline || t.overview}
		<section class="about">
			{#if t.tagline}<p class="tagline">{t.tagline}</p>{/if}
			{#if t.overview}<p>{t.overview}</p>{/if}
		</section>
	{/if}
</main>

<style>
	/* The film's still, fading into the page behind the heading. */
	.backdrop {
		position: absolute;
		inset: 0 0 auto;
		height: calc(220px + env(safe-area-inset-top));
		overflow: hidden;
		z-index: -1;
	}
	.backdrop img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		mask-image: linear-gradient(to bottom, rgb(0 0 0 / 0.55), transparent);
	}
	.over-backdrop .back {
		color: var(--ink);
	}
	header {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 16px;
		align-items: end;
	}
	.poster {
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
		border-radius: var(--radius-sm);
	}
	.heading {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	h1 {
		font-size: 38px;
	}
	.facts,
	.genres {
		font-size: 14px;
	}
	.cert {
		display: inline-block;
		margin-left: 4px;
		padding: 0 6px;
		border: 1.5px solid currentColor;
		border-radius: var(--radius-sm);
		font-size: 12px;
		font-weight: 800;
		line-height: 18px;
	}
	.listed {
		width: 100%;
		min-height: 50px;
		border: 0;
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
		font-size: 16px;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		cursor: pointer;
		transition: opacity 0.1s;
	}
	.listed:active {
		opacity: 0.7;
	}
	.listed.on {
		background: var(--line);
		color: var(--ink);
	}
	.ratings {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		min-height: 52px;
	}
	.score {
		display: grid;
		grid-template-columns: auto auto;
		align-items: baseline;
		column-gap: 6px;
		padding: 8px 14px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: var(--shadow);
		text-decoration: none;
	}
	.score .source {
		grid-column: 1 / -1;
		font-size: 12px;
		font-weight: 700;
		color: var(--muted);
	}
	.score strong {
		font-size: 20px;
		font-weight: 800;
	}
	.score .votes {
		font-size: 12px;
		color: var(--muted);
	}
	.imdb strong {
		color: #f5c518;
	}
	.loading {
		color: var(--muted);
		align-content: center;
	}
	.trailer {
		position: relative;
		display: block;
		aspect-ratio: 16 / 9;
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--poster);
		text-decoration: none;
	}
	.trailer img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.play {
		position: absolute;
		left: 12px;
		bottom: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px 8px 10px;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 800;
		font-size: 15px;
	}
	.play svg {
		width: 20px;
		height: 20px;
		fill: currentColor;
	}
	.about {
		display: flex;
		flex-direction: column;
		gap: 10px;
		line-height: 1.5;
	}
	.tagline {
		font-style: italic;
		color: var(--muted);
	}
</style>
