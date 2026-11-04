# Telly

A film and TV tracker for a household that watches together: one shared watchlist and shared episode progress. A PWA at https://telly.app.haddow.me.

## Worth knowing

- Titles come live from TMDB (`tmdb.ts`), not D1: D1 keeps only what's ours (and OMDb scores, kept a week for the free key's 1,000 lookups a day). TMDB ids are only unique within a kind, so every title is `kind` + `id`.
- Local dev and e2e use made-up titles (`fake-apis.ts`) unless `.dev.vars` has `TMDB_TOKEN`; e2e and `shot.sh` always do (`FAKE_APIS=1`). Add to the fakes when a test needs a new field.
- TMDB's terms: keep the credit on the settings page. Where-to-watch data is JustWatch's, via TMDB, and needs its credit too.

## Review focus

TMDB fields that can be missing or empty, and Workers CPU when parsing big TMDB responses.
