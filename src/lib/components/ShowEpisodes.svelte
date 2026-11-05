<script lang="ts">
	import EpisodeCheck from '#lib/components/EpisodeCheck.svelte';
	import { formatDate, today } from '#lib/dates.ts';
	import { episodeCode, type Episode, type Season } from '#lib/titles.ts';

	let {
		show,
		seasons,
		watchedBySeason,
		watchedAny,
		next
	}: {
		show: number;
		seasons: Season[];
		watchedBySeason: Record<number, number>;
		watchedAny: boolean;
		next: Pick<Episode, 'season' | 'number' | 'name' | 'airDate'> | null;
	} = $props();

	const day = today();
	const nextOut = $derived(!!next?.airDate && next.airDate <= day);
</script>

<section class="episodes" aria-labelledby="episodes">
	<h2 id="episodes">Episodes</h2>

	{#if next && nextOut}
		<div class="card next">
			<span class="text">
				<span class="muted label">Up next · {episodeCode(next)}</span>
				<strong>{next.name}</strong>
			</span>
			<EpisodeCheck {show} season={next.season} episode={next.number} watched={false} />
		</div>
	{:else if next}
		<p class="note">
			{`${episodeCode(next)} ${next.airDate ? `is out ${formatDate(next.airDate, day)}` : 'has no date yet'}.`}
		</p>
	{:else if watchedAny}
		<p class="note">All caught up.</p>
	{/if}

	<ul class="list">
		{#each seasons as s (s.number)}
			{@const seen = watchedBySeason[s.number] ?? 0}
			<li>
				<a href="/tv/{show}/season/{s.number}">
					<span>{s.name}</span>
					<span class="muted" class:done={seen >= s.episodes}>
						{seen >= s.episodes
							? '✓ Watched'
							: seen
								? `${seen} of ${s.episodes}`
								: `${s.episodes} episodes`}
						›
					</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

<style>
	.episodes {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.next {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 12px 12px 16px;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.label {
		font-size: 13px;
		font-weight: 700;
	}
	.list a {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		text-decoration: none;
		font-weight: 700;
	}
	.done {
		color: var(--good);
	}
</style>
