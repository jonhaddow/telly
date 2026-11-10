# Telly

What to watch next, and where: a film and TV tracker, as a phone web app for a household.

A shared watchlist shows where each title is streaming (your services first), its IMDb, Rotten Tomatoes and Metacritic scores and the trailer. Episode tracking builds an Up next queue, and push alerts flag new episodes and titles arriving on your services.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team)
- Google sign-in ([Arctic](https://arcticjs.dev)) for an allowlist of users
- [Tailwind CSS](https://tailwindcss.com) and [shadcn-svelte](https://shadcn-svelte.com)
- Film and TV data from [TMDB](https://www.themoviedb.org), scores from [OMDb](https://www.omdbapi.com)
- Web push notifications from an hourly cron trigger
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Development

See [`docs/development.md`](docs/development.md) for running it locally, configuration and deploying.
