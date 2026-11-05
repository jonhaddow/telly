<script lang="ts">
	import { enhance } from '$app/forms';
	import EpisodeCheck from '#lib/components/EpisodeCheck.svelte';
	import { formatDate } from '#lib/dates.ts';
	import { stay } from '#lib/forms.ts';
	import { formatRuntime } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const aired = $derived(data.episodes.filter((e) => e.airDate && e.airDate <= data.today));
	const allWatched = $derived(aired.length > 0 && aired.every((e) => e.watched));
	const count = $derived(data.episodes.filter((e) => e.watched).length);
</script>

<svelte:head>
	<title>{data.season.name} · {data.show.name} · Telly</title>
</svelte:head>

<main class="page">
	<a class="back" href="/tv/{data.show.id}">{data.show.name}</a>
	<header>
		<h1>{data.season.name}</h1>
		<p class="muted">{count} of {data.episodes.length} watched</p>
	</header>

	{#if aired.length}
		<form method="POST" action="?/watched" use:enhance={stay}>
			<input type="hidden" name="show" value={data.show.id} />
			<input type="hidden" name="season" value={data.season.number} />
			<input type="hidden" name="watched" value={allWatched ? '0' : '1'} />
			<button class="chip" class:on={allWatched}>
				{allWatched ? '✓ Season watched' : 'Mark season watched'}
			</button>
		</form>
	{/if}

	<ol class="list">
		{#each data.episodes as e (e.number)}
			{@const out = e.airDate && e.airDate <= data.today}
			<li class:watched={e.watched}>
				<span class="num">{e.number}</span>
				<span class="text">
					<strong>{e.name}</strong>
					<span class="muted">
						{[
							e.airDate && `${out ? '' : 'Out '}${formatDate(e.airDate, data.today)}`,
							e.runtime && formatRuntime(e.runtime)
						]
							.filter(Boolean)
							.join(' · ')}
					</span>
				</span>
				{#if out || e.watched}
					<EpisodeCheck
						show={data.show.id}
						season={data.season.number}
						episode={e.number}
						watched={e.watched}
					/>
				{/if}
			</li>
		{/each}
	</ol>
</main>

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	li {
		display: grid;
		grid-template-columns: 28px 1fr auto;
		align-items: center;
		gap: 12px;
		min-height: 64px;
		padding: 8px 12px 8px 16px;
	}
	.num {
		font-weight: 800;
		color: var(--muted);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	strong {
		font-weight: 700;
	}
	.text .muted {
		font-size: 13px;
	}
	.watched strong {
		color: var(--muted);
	}
</style>
