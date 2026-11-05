<script lang="ts">
	import { enhance } from '$app/forms';
	import { stay } from '#lib/forms.ts';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import Poster from '#lib/components/Poster.svelte';
	import { titlePath } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The box keeps what's typed (spaces and all); results follow it.
	let text = $state(page.url.searchParams.get('q') ?? '');
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Arriving with other words (the Search tab, the browser's Back): show those. Not after the
	// box's own updates, which would trim a space still being typed.
	afterNavigate(({ type }) => {
		if (type !== 'goto') text = page.url.searchParams.get('q') ?? '';
	});
	// Leaving before the pause is up: don't pull the next page back to search.
	$effect(() => () => clearTimeout(timer));

	// Results update as you type, a moment after you stop. The address keeps the
	// words, so the browser's Back from a title returns to the same results.
	function onInput() {
		const q = text.trim();
		clearTimeout(timer);
		timer = setTimeout(() => {
			void goto(q ? `/search?q=${encodeURIComponent(q)}` : '/search', {
				replace: true,
				reset: false
			});
		}, 300);
	}
</script>

<svelte:head>
	<title>{data.q ? `${data.q} · ` : ''}Search · Telly</title>
</svelte:head>

<main class="page">
	<h1>Search</h1>

	<form method="GET" role="search">
		<input
			type="search"
			name="q"
			bind:value={text}
			oninput={onInput}
			placeholder="Films and shows"
			aria-label="Search films and shows"
			autocomplete="off"
			enterkeyhint="search"
		/>
	</form>

	{#if data.failed}
		<p class="error">Search isn’t working right now. Please try again in a moment.</p>
	{:else if data.q && !data.results.length}
		<p class="muted">Nothing found for “{data.q}”.</p>
	{/if}

	{#if data.results.length}
		<ul class="list results">
			{#each data.results as t (`${t.kind}-${t.id}`)}
				<li>
					<a href={titlePath(t)}>
						<Poster path={t.poster} name={t.name} width="w92" />
						<span class="text">
							<strong>{t.name}</strong>
							<span class="muted">
								{t.kind === 'movie' ? 'Film' : 'TV'}{t.years ? ` · ${t.years}` : ''}
							</span>
						</span>
					</a>
					<form method="POST" action={t.listed ? '?/remove' : '?/add'} use:enhance={stay}>
						<input type="hidden" name="kind" value={t.kind} />
						<input type="hidden" name="id" value={t.id} />
						<button
							class="add"
							class:on={t.listed}
							aria-label={t.listed
								? `Remove ${t.name} from the watchlist`
								: `Add ${t.name} to the watchlist`}
						>
							{t.listed ? '✓' : '+'}
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	input {
		width: 100%;
		min-height: 52px;
		padding: 12px 18px;
		border-radius: var(--radius);
		border: 1.5px solid var(--field);
		background: var(--card);
		font-size: 17px;
	}
	input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
		border-color: transparent;
	}
	.results li {
		display: flex;
		align-items: center;
		padding-right: 10px;
	}
	.results a {
		flex: 1;
		min-width: 0;
		display: grid;
		grid-template-columns: 48px 1fr;
		gap: 14px;
		align-items: center;
		padding: 10px 14px;
		text-decoration: none;
	}
	.results a:active {
		background: var(--line);
	}
	.add {
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: var(--radius);
		background: var(--line);
		color: var(--ink);
		font-size: 22px;
		font-weight: 700;
		cursor: pointer;
	}
	.add.on {
		background: var(--accent);
		color: var(--on-accent);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	strong {
		font-size: 16px;
		font-weight: 700;
	}
	.text .muted {
		font-size: 14px;
	}
</style>
