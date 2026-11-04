import { error, json } from '@sveltejs/kit';
import { saveSubscription, validSubscription } from '#lib/server/push.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json().catch(() => null);
	if (!validSubscription(body)) error(400, 'Not a push subscription');
	await saveSubscription(locals.db, locals.user!.id, body);
	return json({ ok: true });
};
