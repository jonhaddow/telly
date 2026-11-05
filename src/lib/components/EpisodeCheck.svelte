<script lang="ts">
	import { enhance } from '$app/forms';
	import { stay } from '#lib/forms.ts';
	import { episodeCode } from '#lib/titles.ts';

	let {
		show,
		season,
		episode,
		watched
	}: { show: number; season: number; episode: number; watched: boolean } = $props();

	const code = $derived(episodeCode({ season, number: episode }));
</script>

<!-- A round tick: tap to mark the episode watched, tap again to undo. -->
<form method="POST" action="?/watched" use:enhance={stay}>
	<input type="hidden" name="show" value={show} />
	<input type="hidden" name="season" value={season} />
	<input type="hidden" name="episode" value={episode} />
	<input type="hidden" name="watched" value={watched ? '0' : '1'} />
	<button
		class:on={watched}
		aria-label={watched ? `${code} watched; mark not watched` : `Mark ${code} watched`}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9" /></svg>
	</button>
</form>

<style>
	button {
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		border: 2px solid var(--field);
		background: transparent;
		color: var(--muted);
		display: grid;
		place-items: center;
		cursor: pointer;
		transition:
			background-color 0.15s,
			scale 0.1s;
	}
	button:active {
		scale: 0.9;
	}
	button.on {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--on-accent);
	}
	svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
