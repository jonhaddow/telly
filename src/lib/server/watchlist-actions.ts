import { fail, type RequestEvent } from '@sveltejs/kit';
import { apis } from './apis.ts';
import { addToWatchlist, removeFromWatchlist } from './watchlist.ts';
import { KINDS, type Kind } from '../titles.ts';

/** The title a form names (kind and id fields). */
async function target(request: Request) {
	const form = await request.formData();
	const kind = String(form.get('kind')) as Kind;
	const id = Number(form.get('id'));
	return KINDS.includes(kind) && Number.isInteger(id) && id > 0 ? { kind, id } : null;
}

/** Add and remove, for any page that lists titles. */
export const watchlistActions = {
	add: async ({ request, locals }: RequestEvent) => {
		const t = await target(request);
		if (!t) return fail(400);
		const title = await (await apis()).tmdb.title(t.kind, t.id);
		if (!title) return fail(404);
		await addToWatchlist(locals.db, title, locals.user!.id);
	},
	remove: async ({ request, locals }: RequestEvent) => {
		const t = await target(request);
		if (!t) return fail(400);
		await removeFromWatchlist(locals.db, t.kind, t.id);
	}
};
