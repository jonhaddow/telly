import { fail, type RequestEvent } from '@sveltejs/kit';
import { apis } from './apis.ts';
import { watchAll } from './episodes.ts';
import { addToWatchlist, removeFromWatchlist, setSeen } from './watchlist.ts';
import { KINDS } from '../titles.ts';

/** The title a form names (kind and id fields). */
function target(form: FormData) {
	const kind = KINDS.find((k) => k === form.get('kind'));
	const id = Number(form.get('id'));
	return kind && Number.isInteger(id) && id > 0 ? { kind, id } : null;
}

/** Add, remove and (films) mark seen, for any page that lists titles. */
export const watchlistActions = {
	add: async ({ request, locals }: RequestEvent) => {
		const t = target(await request.formData());
		if (!t) return fail(400);
		const title = await (await apis()).tmdb.title(t.kind, t.id);
		if (!title) return fail(404);
		await addToWatchlist(locals.db, title, locals.user!.id);
	},
	/**
	 * Films: seen=1 marks it seen, otherwise back to the watchlist. Shows: ticks
	 * every episode out so far.
	 */
	seen: async ({ request, locals }: RequestEvent) => {
		const form = await request.formData();
		const t = target(form);
		if (!t) return fail(400);
		const { tmdb } = await apis();
		const title = await tmdb.title(t.kind, t.id);
		if (!title) return fail(404);
		const userId = locals.user!.id;
		if (t.kind === 'tv') await watchAll(locals.db, tmdb, title, userId);
		else await setSeen(locals.db, title, form.get('seen') === '1', userId);
	},
	remove: async ({ request, locals }: RequestEvent) => {
		const t = target(await request.formData());
		if (!t) return fail(400);
		await removeFromWatchlist(locals.db, t.kind, t.id);
	}
};
