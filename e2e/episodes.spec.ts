import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('tick episodes: a season, up next on the show and the watchlist', async ({ page }) => {
	await open(page, '/tv/2001');
	const seasons = page.getByRole('region', { name: 'Episodes' });
	await expect(seasons.getByRole('link')).toHaveText([
		/Series 1\s+3 episodes/,
		/Series 2\s+3 episodes/,
		/Series 3\s+3 episodes/
	]);

	// A whole season.
	await seasons.getByRole('link', { name: /Series 1/ }).click();
	await page.getByRole('button', { name: 'Mark season watched' }).click();
	await expect(page.getByText('3 of 3 watched')).toBeVisible();
	await expect(page.getByRole('button', { name: 'S1 E2 watched; mark not watched' })).toBeVisible();

	// The show now has an episode up next, and is on the watchlist.
	await page.getByRole('link', { name: 'Harbour Lights', exact: true }).click();
	await expect(page.getByText('Up next · S2 E1')).toBeVisible();
	await expect(page.getByRole('button', { name: '✓ Watchlist' })).toBeVisible();
	await page.getByRole('button', { name: 'Mark S2 E1 watched' }).click();
	await expect(page.getByText('Up next · S2 E2')).toBeVisible();

	// And on the watchlist page.
	await open(page, '/');
	const upNext = page.getByRole('region', { name: 'Up next' });
	await expect(upNext.getByText('S2 E2 · Harbour Lights 2.2')).toBeVisible();
	await upNext.getByRole('button', { name: 'Mark S2 E2 watched' }).click();
	await expect(upNext.getByText('S2 E3 · Harbour Lights 2.3')).toBeVisible();

	// The latest episode isn't out yet: no tick, and nothing up next after the one before it.
	await open(page, '/tv/2001/season/3');
	await expect(page.getByText(/^Out /)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Mark S3 E3 watched' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Mark S3 E2 watched' }).click();
	await expect(page.getByText('1 of 3 watched')).toBeVisible();
	await open(page, '/');
	await expect(page.getByRole('region', { name: 'Up next' })).toHaveCount(0);
	await open(page, '/tv/2001');
	await expect(page.getByText(/S3 E3 is out /)).toBeVisible();

	// Caught up, so it's seen.
	await open(page, '/?list=seen&kind=tv');
	await expect(page.getByRole('link', { name: /Harbour Lights/ })).toBeVisible();

	// Off the list again (for the other tests), and it stays off.
	await open(page, '/tv/2001');
	await page.getByRole('button', { name: '✓ Seen' }).click();
	await expect(page.getByRole('button', { name: '+ Watchlist' })).toBeVisible();
	await open(page, '/tv/2001');
	await expect(page.getByRole('button', { name: '+ Watchlist' })).toBeVisible();
});

test('mark a whole show seen', async ({ page }) => {
	await open(page, '/tv/2001');
	await page.getByRole('button', { name: 'Seen it' }).click();
	await expect(page.getByRole('button', { name: '✓ Seen' })).toBeVisible();
	await open(page, '/tv/2001/season/1');
	await expect(page.getByText('3 of 3 watched')).toBeVisible();

	// Off the list again, episodes unticked (for the other tests).
	for (const season of [1, 2]) {
		await open(page, `/tv/2001/season/${season}`);
		await page.getByRole('button', { name: '✓ Season watched' }).click();
		await expect(page.getByText('0 of 3 watched')).toBeVisible();
	}
	await open(page, '/tv/2001/season/3');
	await page.getByRole('button', { name: 'S3 E2 watched; mark not watched' }).click();
	await expect(page.getByRole('button', { name: 'Mark S3 E2 watched' })).toBeVisible();
	await page.getByRole('button', { name: 'S3 E1 watched; mark not watched' }).click();
	await expect(page.getByRole('button', { name: 'Mark S3 E1 watched' })).toBeVisible();
	await open(page, '/tv/2001');
	await page.getByRole('button', { name: '✓ Watchlist' }).click();
	await expect(page.getByRole('button', { name: '+ Watchlist' })).toBeVisible();
	await expect(page.getByText(/Up next/)).toHaveCount(0);
});
