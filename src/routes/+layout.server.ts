import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({
	user: locals.user && { name: locals.user.name, email: locals.user.email }
});
