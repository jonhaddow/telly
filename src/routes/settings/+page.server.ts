import { allowedUsers } from '#lib/server/auth.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	people: await allowedUsers(locals.db)
});
