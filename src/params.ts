import { defineParams } from '@sveltejs/kit/params';
import { KINDS, type Kind } from '#lib/titles.ts';

export const params = defineParams({
	/** movie or tv. */
	kind: (param) => (KINDS.includes(param as Kind) ? (param as Kind) : undefined),
	/** TMDB's ids: positive whole numbers. */
	id: (param) => (/^[1-9]\d{0,9}$/.test(param) ? Number(param) : undefined)
});
