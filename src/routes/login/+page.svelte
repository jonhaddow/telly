<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Sign in · Telly</title>
</svelte:head>

<main class="login">
	<p class="on-air" aria-hidden="true">On tonight</p>
	<h1>Telly</h1>
	<p class="tagline">What to watch next, and where.</p>

	{#if data.error}<p class="error" role="alert">{data.error}</p>{/if}

	<Button href="/auth/google?next={encodeURIComponent(data.next)}">
		<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
			<path
				fill="currentColor"
				d="M21.35 11.1H12v2.98h5.35c-.23 1.45-1.66 4.25-5.35 4.25-3.22 0-5.85-2.67-5.85-5.96S8.78 6.41 12 6.41c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.69 3.85 14.55 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.06-.15-1.51z"
			/>
		</svg>
		Sign in with Google
	</Button>

	{#if data.devUsers.length}
		<form method="POST" action="?/dev" class="dev">
			<input type="hidden" name="next" value={data.next} />
			<p class="muted">Development only</p>
			{#each data.devUsers as u (u.email)}
				<Button variant="outline" name="email" value={u.email}>Sign in as {u.name}</Button>
			{/each}
		</form>
	{/if}
</main>

<style>
	/* Left-aligned like a listings page: a small "on tonight" cue, then the
	   name, huge and in the accent. */
	.login {
		max-width: 400px;
		margin: 0 auto;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 24px 24px calc(48px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 16px;
	}
	.on-air {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--muted);
	}
	.on-air::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--over);
		box-shadow: 0 0 10px var(--over);
	}
	h1 {
		margin: -8px 0 -4px;
		font-size: 128px;
		line-height: 0.85;
		color: var(--accent);
	}
	.tagline {
		font-size: 19px;
		margin-bottom: 24px;
	}
	.dev {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
	}
	.dev p {
		font-size: 13px;
	}
</style>
