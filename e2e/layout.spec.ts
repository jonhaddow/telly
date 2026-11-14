import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

// The pages scroll inside the app, under the tabs, not the window: the app keeps
// track of where each page was left itself.
test('the page scrolls under the tabs, and back returns to where it was', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 300 });
	await open(page, '/');
	const scroller = page.locator('.scroll');
	const tabs = page.getByRole('navigation', { name: 'Main' });
	const box = (await tabs.boundingBox())!;
	expect(box.y + box.height).toBeLessThanOrEqual(300);
	expect(box.y + box.height).toBeGreaterThan(250);

	// The keys scroll it, without clicking in it first.
	await page.keyboard.press('End');
	const top = await scroller.evaluate((el) => el.scrollHeight - el.clientHeight);
	expect(top).toBeGreaterThan(0);
	await expect(scroller).toHaveJSProperty('scrollTop', top);

	await tabs.getByRole('link', { name: 'Search' }).click();
	await expect(scroller).toHaveJSProperty('scrollTop', 0);

	await page.goBack();
	await expect(page).toHaveURL('/');
	await expect(scroller).toHaveJSProperty('scrollTop', top);
});
