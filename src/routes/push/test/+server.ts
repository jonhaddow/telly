import { error, json } from '@sveltejs/kit';
import { notify } from '#lib/server/push.ts';
import { pushConfig } from '#lib/server/push-config.ts';
import type { RequestHandler } from './$types';

/** Sends a test notification to the signed-in person's devices. */
export const POST: RequestHandler = async ({ locals }) => {
	const cfg = pushConfig();
	if (!cfg) error(503, 'Notifications aren’t set up on this server');
	const result = await notify(
		locals.db,
		cfg,
		{
			title: 'Notifications are on',
			body: 'New episodes and films arriving on your services will show up like this.',
			url: '/',
			badge: 0,
			tag: 'test'
		},
		locals.user!.id
	);
	return json(result);
};
