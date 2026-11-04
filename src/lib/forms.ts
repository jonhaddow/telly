import type { SubmitFunction } from '$app/forms';

/**
 * For `use:enhance`: stay on this page (with its search words) after a form
 * posts to one of its actions, reloading its data. SvelteKit 3 otherwise
 * navigates to the action's address, which drops the query.
 */
export const stay: SubmitFunction =
	() =>
	({ update }) =>
		update({ navigate: false });
