import { error, json } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { today } from '#lib/dates.ts';
import { checkTitles, combine } from '#lib/server/alerts.ts';
import { apis } from '#lib/server/apis.ts';
import { notify } from '#lib/server/push.ts';
import { pushConfig } from '#lib/server/push-config.ts';
import type { RequestHandler } from './$types';

/** Called by the hourly cron (worker/entry.js) with the cron secret. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) error(403);
	const notices = await checkTitles(locals.db, (await apis()).tmdb, today());
	const cfg = pushConfig();
	const notice = combine(notices);
	const sent = cfg && notice ? await notify(locals.db, cfg, notice) : null;
	return json({ notices: notices.map((n) => n.title), sent });
};
