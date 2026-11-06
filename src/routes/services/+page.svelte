<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { imageUrl } from '#lib/titles.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Your services · Telly</title>
</svelte:head>

<main class="page">
	<a class="back" href="/settings">Settings</a>
	<h1>Your services</h1>
	<p class="muted">
		The ones you pay for or watch free. Titles on these come first, and the watchlist can show just
		those.
	</p>

	{#if data.most.length}
		<section class="most" aria-labelledby="most">
			<h2 id="most">Most of your watchlist</h2>
			<ul class="list">
				{#each data.most as s (s.id)}
					<li>
						<a href="/?on={s.id}">
							{#if s.logo}<img src={imageUrl(s.logo, 'w92')} alt="" />{/if}
							<span>{s.name}</span>
							<span class="count">{s.count} {s.count === 1 ? 'title' : 'titles'}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
		<h2>Pick yours</h2>
	{/if}

	<form method="POST">
		<ul class="services">
			{#each data.services as s (s.id)}
				<li>
					<label>
						<input
							type="checkbox"
							name="service"
							value={s.id}
							checked={data.chosen.includes(s.id)}
						/>
						{#if s.logo}<img src={imageUrl(s.logo, 'w92')} alt="" />{/if}
						<span>{s.name}</span>
					</label>
				</li>
			{/each}
		</ul>
		<div class="save">
			<Button type="submit" class="w-full">Save</Button>
		</div>
	</form>
</main>

<style>
	.services {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	label {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 52px;
		padding: 6px 10px 6px 6px;
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: var(--shadow);
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
	}
	label:has(input:checked) {
		outline: 2.5px solid var(--accent);
		outline-offset: -2.5px;
	}
	label:has(input:focus-visible) {
		outline: 2px solid var(--ink);
	}
	input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	img {
		width: 38px;
		height: 38px;
		border-radius: var(--radius-sm);
		flex: none;
	}
	span {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.most {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.most a {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 14px 8px 8px;
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
	}
	.count {
		margin-left: auto;
		flex: none;
		color: var(--muted);
		font-weight: 400;
	}
	/* Over the tab bar, so it's always in reach. */
	.save {
		position: sticky;
		bottom: calc(var(--tabs) + 16px + env(safe-area-inset-bottom));
		margin-top: 16px;
	}
</style>
