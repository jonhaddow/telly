<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Poster from '#lib/components/Poster.svelte';
	import { titlePath } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The box keeps what's typed (spaces and all); results follow it.
	let text = $state(page.url.searchParams.get('q') ?? '');
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Results update as you type, a moment after you stop. The address keeps the
	// words, so Back from a title returns to the same results.
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
		border-radius: 16px;
		border: 1.5px solid var(--field);
		background: var(--card);
		font-size: 17px;
	}
	input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
		border-color: transparent;
	}
	.results a {
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
