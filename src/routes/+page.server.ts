import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The watchlist will live here; until then, search.
export const load: PageServerLoad = () => redirect(307, '/search');
