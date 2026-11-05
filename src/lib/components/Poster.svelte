<script lang="ts">
	import { imageUrl, type ImageWidth } from '#lib/titles.ts';

	let {
		path,
		name,
		width = 'w185'
	}: { path: string | null; name: string; width?: ImageWidth } = $props();
</script>

<!-- 2:3, like every poster. No image: the name on a plain card (too small in lists). -->
<div class="poster">
	{#if path}
		<img src={imageUrl(path, width)} alt="" loading="lazy" decoding="async" />
	{:else if width !== 'w92'}
		<span aria-hidden="true">{name}</span>
	{/if}
</div>

<style>
	.poster {
		aspect-ratio: 2 / 3;
		border-radius: 4px;
		overflow: hidden;
		background: var(--poster);
		display: grid;
		place-items: center;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	span {
		padding: 8px;
		font-size: 12px;
		font-weight: 700;
		text-align: center;
		color: var(--muted);
		overflow: hidden;
	}
</style>
