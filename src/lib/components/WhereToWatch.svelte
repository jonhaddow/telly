<script lang="ts">
	import { imageUrl, type Provider, type Providers } from '#lib/titles.ts';

	let { providers, ours }: { providers: Providers; ours: number[] } = $props();

	const mine = (p: Provider) => ours.includes(p.id);
	// Ours first in each group.
	const sorted = (list: Provider[]) => [...list.filter(mine), ...list.filter((p) => !mine(p))];
	const groups = $derived(
		[
			{ label: 'Stream', list: sorted(providers.stream) },
			{ label: 'Free', list: sorted(providers.free) },
			{ label: 'Rent or buy', list: sorted(providers.buy) }
		].filter((g) => g.list.length)
	);
	const onOurs = $derived([...providers.stream, ...providers.free].filter(mine));
</script>

<section class="where" aria-labelledby="where">
	<h2 id="where">Where to watch</h2>

	{#if onOurs.length}
		<p class="yes">On {onOurs.map((p) => p.name).join(' and ')}</p>
	{/if}

	{#each groups as g (g.label)}
		<div class="group">
			<h3 class="muted">{g.label}</h3>
			<ul>
				{#each g.list as p (p.id)}
					<li class:mine={mine(p)}>
						{#if p.logo}<img src={imageUrl(p.logo, 'w92')} alt="" />{/if}
						<span>{p.name}</span>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<p class="muted">Not on any UK service right now.</p>
	{/each}

	{#if !ours.length}
		<p class="muted small"><a href="/services">Pick your services</a> to see which you have.</p>
	{/if}

	<p class="muted small">
		{#if providers.link}<a href={providers.link}>Links to each service</a> ·
		{/if}Data from
		<a href="https://www.justwatch.com">JustWatch</a>
	</p>
</section>

<style>
	.where {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.yes {
		background: var(--note-bg);
		color: var(--note-ink);
		border-radius: 12px;
		padding: 10px 14px;
		font-weight: 700;
	}
	h3 {
		margin: 0 0 6px;
		font-size: 13px;
		font-weight: 700;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 12px 5px 5px;
		border-radius: 12px;
		background: var(--card);
		box-shadow: var(--shadow);
		font-size: 14px;
		font-weight: 600;
	}
	li.mine {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	img {
		width: 30px;
		height: 30px;
		border-radius: 8px;
	}
	.small {
		font-size: 13px;
	}
</style>
