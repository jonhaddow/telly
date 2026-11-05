# Telly

What to watch next, and where: a film and TV tracker as a phone web app for a household, at https://telly.app.haddow.me. A shared watchlist; where to watch each title, your services first; IMDb, Rotten Tomatoes and Metacritic scores and the trailer. Shared episode tracking with an Up next queue, and push alerts for new episodes and titles arriving on your services. What's next: `docs/roadmap.md`.

SvelteKit on Cloudflare Workers, with D1 (Drizzle). Film and TV data from [TMDB](https://www.themoviedb.org), scores from [OMDb](https://www.omdbapi.com). Sign-in is Google, for an allowlist in the `user` table.

## Develop

```sh
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npx wrangler d1 execute telly --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
npm run dev
```

Without `TMDB_TOKEN` in `.dev.vars`, the app shows a few made-up titles (`src/lib/server/fake-apis.ts`). Sign in with the development-only button on the login page.

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check`, `npm run lint`.

## Deploy

Secrets: `GOOGLE_CLIENT_SECRET`, `TMDB_TOKEN` (TMDB's API Read Access Token), `OMDB_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET` (any long random string; the hourly check sends it to `/check`) (`wrangler secret put`).

Pushing to `main` deploys through Cloudflare Workers Builds, whose deploy command `npm run deploy:ci` applies D1 migrations first. Back up the data with `npx wrangler d1 export telly --remote --output telly.sql`.
