import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('search, open a film and see its ratings and trailer', async ({ page }) => {
	await open(page, '/');
	await expect(page).toHaveURL(/\/search$/);
	await page.getByRole('searchbox', { name: 'Search films and shows' }).fill('light');
	await expect(page).toHaveURL(/q=light/);
	await expect(page.getByRole('link', { name: /Harbour Lights/ })).toBeVisible();

	await page.getByRole('link', { name: /The Long Light/ }).click();
	await expect(page.getByRole('heading', { name: 'The Long Light' })).toBeVisible();
	await expect(page.getByText('Film · 2024 · 1h 52m')).toBeVisible();
	await expect(page.getByRole('link', { name: /IMDb\s*7\.8/ })).toBeVisible();
	await expect(page.getByText('91%')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Watch the trailer' })).toHaveAttribute(
		'href',
		'https://www.youtube.com/watch?v=fakeTrailer1'
	);

	// Back keeps the search.
	await page.getByRole('link', { name: '‹ Back' }).click();
	await expect(page).toHaveURL(/q=light/);
	await expect(page.getByRole('searchbox')).toHaveValue('light');
});

test('a show that is still running', async ({ page }) => {
	await open(page, '/tv/2001');
	await expect(page.getByText('TV · 2022– · 3 seasons · 45m')).toBeVisible();
	await expect(page.getByRole('link', { name: /IMDb\s*8\.2/ })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Watch the trailer' })).toHaveCount(0);
});

test('an unknown title', async ({ page }) => {
	const res = await page.goto('/movie/999');
	expect(res?.status()).toBe(404);
});
