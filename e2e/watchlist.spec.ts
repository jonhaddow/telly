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

	// Films first with no episode up next; then the tab last opened.
	await open(page, '/');
	const grid = page.getByRole('list').last();
	await expect(grid.getByRole('link')).toHaveText([/The Long Light/]);
	await page.getByRole('link', { name: 'TV' }).click();
	await expect(grid.getByRole('link')).toHaveText([/Harbour Lights/]);
	await open(page, '/');
	await expect(page.getByRole('link', { name: 'TV' })).toHaveAttribute('aria-current', 'page');
	await expect(page.getByRole('link', { name: 'To rent' })).toHaveCount(0);
	await page.getByRole('link', { name: 'Films' }).click();
	await expect(grid.getByRole('link')).toHaveText([/The Long Light/]);
	await page.getByRole('link', { name: 'On our services' }).click();
	await expect(grid.getByRole('link', { name: /The Long Light.*on Netflix/ })).toBeVisible();
	await page.getByRole('link', { name: 'To rent' }).click();
	await expect(grid.getByRole('link')).toHaveText([/The Long Light/]);

	// By genre, and by a service that isn't ours, from Your services' counts.
	await open(page, '/?kind=tv');
	await page.getByLabel('Genre').selectOption('Crime');
	await expect(grid.getByRole('link')).toHaveText([/Harbour Lights/]);
	await open(page, '/services');
	const most = page.getByRole('region', { name: 'Most of your watchlist' });
	await expect(most.getByRole('link')).toHaveText([/Netflix.*1 title/, /BBC iPlayer.*1 title/]);
	await most.getByRole('link', { name: /BBC iPlayer/ }).click();
	await expect(page.getByRole('link', { name: 'On BBC iPlayer: show all' })).toBeVisible();
	await expect(grid.getByRole('link')).toHaveText([/Harbour Lights/]);

	// Remove it again.
	await open(page, '/?kind=movie');
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
