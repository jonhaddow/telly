import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('pick services, add from search and a title page, filter, remove', async ({ page }) => {
	await open(page, '/');
	await expect(page.getByText('Nothing here yet.')).toBeVisible();

	// Services: Netflix only.
	await open(page, '/services');
	await page.getByText('Netflix', { exact: true }).click();
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page).toHaveURL(/\/settings$/);

	// From search.
	await open(page, '/search?q=harbour');
	await page.getByRole('button', { name: 'Add Harbour Lights to the watchlist' }).click();
	await expect(
		page.getByRole('button', { name: 'Remove Harbour Lights from the watchlist' })
	).toBeVisible();

	// From a title page, which shows where to watch with ours first.
	await open(page, '/movie/1001');
	await expect(page.getByText('On Netflix')).toBeVisible();
	await expect(page.getByText('Rent or buy')).toBeVisible();
	await page.getByRole('button', { name: '+ Watchlist' }).click();
	await expect(page.getByRole('button', { name: '✓ Watchlist' })).toBeVisible();

	await open(page, '/');
	const grid = page.getByRole('list').last();
	await expect(grid.getByRole('link')).toHaveText([/The Long Light/, /Harbour Lights/]);
	await page.getByRole('link', { name: 'Films' }).click();
	await expect(grid.getByRole('link')).toHaveText([/The Long Light/]);
	await page.getByRole('link', { name: 'All' }).click();
	await expect(grid.getByRole('link')).toHaveCount(2);
	await page.getByRole('link', { name: 'On our services' }).click();
	await expect(grid.getByRole('link')).toHaveCount(1);
	await expect(grid.getByRole('link', { name: /The Long Light.*on Netflix/ })).toBeVisible();
	// To rent turns On our services off: one at a time.
	await page.getByRole('link', { name: 'To rent' }).click();
	await expect(page.getByRole('link', { name: 'To rent' })).toHaveAttribute('aria-current', 'true');
	await expect(page.getByRole('link', { name: 'On our services' })).not.toHaveAttribute(
		'aria-current'
	);
	await expect(grid.getByRole('link')).toHaveText([/The Long Light/]);

	// Remove it again.
	await grid.getByRole('link', { name: /The Long Light/ }).click();
	await page.getByRole('button', { name: '✓ Watchlist' }).click();
	await expect(page.getByRole('button', { name: '+ Watchlist' })).toBeVisible();
});

test('mark a film seen, find it on Seen, and put it back', async ({ page }) => {
	await open(page, '/movie/1001');
	await page.getByRole('button', { name: 'Seen it' }).click();
	await expect(page.getByRole('button', { name: '✓ Seen' })).toBeVisible();

	await open(page, '/');
	await expect(page.getByRole('link', { name: 'The Long Light' })).toHaveCount(0);
	await page.getByRole('link', { name: 'Seen' }).click();
	await expect(page.getByRole('heading', { name: 'Seen' })).toBeVisible();
	await page.getByRole('link', { name: /The Long Light/ }).click();

	// Seen by mistake: back to the watchlist.
	await page.getByRole('button', { name: '✓ Seen' }).click();
	await expect(page.getByRole('button', { name: '✓ Watchlist' })).toBeVisible();
	await page.getByRole('button', { name: '✓ Watchlist' }).click();
	await expect(page.getByRole('button', { name: '+ Watchlist' })).toBeVisible();
});
