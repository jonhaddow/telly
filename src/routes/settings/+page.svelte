<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Settings · Telly</title>
</svelte:head>

<main class="page">
	<h1>Settings</h1>

	<ul class="list">
		<li><a href="/services">Your services <span class="muted">›</span></a></li>
		<li><a href="/notifications">Notifications <span class="muted">›</span></a></li>
	</ul>

	<section class="group people">
		<h2>Who can sign in</h2>
		<ul class="list">
			{#each data.people as u (u.email)}
				<li>
					<span>{u.name}</span>
					<span class="muted">{u.email}</span>
				</li>
			{/each}
		</ul>
	</section>

	<p class="muted credit">
		Film and TV information from <a href="https://www.themoviedb.org">TMDB</a>. This app uses the
		TMDB API but is not endorsed or certified by TMDB. Where to watch from
		<a href="https://www.justwatch.com">JustWatch</a>. Ratings from
		<a href="https://www.omdbapi.com">OMDb</a>.
	</p>

	<form method="POST" action="/logout">
		<Button variant="destructive" class="w-full">Sign out ({data.user?.name})</Button>
	</form>
</main>

<style>
	.list li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
	}
	.list a {
		display: flex;
		justify-content: space-between;
		flex: 1;
		text-decoration: none;
		font-weight: 700;
	}
	.list li:has(a) {
		padding: 0;
	}
	.list li a {
		padding: 14px 16px;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.credit {
		font-size: 13px;
		line-height: 1.5;
	}
	.people .muted {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
