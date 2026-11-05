import { expect, test } from '@playwright/test';

test('the hourly check needs the cron secret', async ({ request }) => {
	expect((await request.post('/check')).status()).toBe(403);
	const res = await request.post('/check', { headers: { 'x-cron-secret': 'dev-cron-secret' } });
	expect(res.status()).toBe(200);
	expect(await res.json()).toMatchObject({ notices: expect.any(Array) as unknown[] });
});
