# Telly

What to watch next, and where: a film and TV tracker, as a phone web app for a household.

A shared watchlist shows where each title is streaming (your services first), its IMDb, Rotten Tomatoes and Metacritic scores and the trailer. Episode tracking builds an Up next queue, and push alerts flag new episodes and titles arriving on your services.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team)
- Google sign-in (OAuth with PKCE, shared code in [`auth`](https://github.com/jonhaddow/auth)) for an allowlist of users
- [Tailwind CSS](https://tailwindcss.com) and [shadcn-svelte](https://shadcn-svelte.com)
- Film and TV data from [TMDB](https://www.themoviedb.org), scores from [OMDb](https://www.omdbapi.com)
- Web push notifications from an hourly cron trigger
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Running locally

```sh
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npx wrangler d1 execute telly --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
npm run dev    # the login page has a dev-only sign-in button
```

Without `TMDB_TOKEN` in `.dev.vars`, it shows a few made-up titles.

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check` (types), `npm run lint`.
