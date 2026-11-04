import { json } from '@sveltejs/kit';
import { removeSubscription } from '#lib/server/push.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
	if (typeof body?.endpoint === 'string') await removeSubscription(locals.db, body.endpoint);
	return json({ ok: true });
};
