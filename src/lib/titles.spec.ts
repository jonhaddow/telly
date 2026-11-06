import { describe, expect, it } from 'vitest';
import { listGenres } from './titles.ts';

describe('listGenres', () => {
	it("splits TV's paired genres into film ones, once each", () => {
		expect(listGenres(['Sci-Fi & Fantasy', 'Action & Adventure', 'Science Fiction'])).toEqual([
			'Science Fiction',
			'Fantasy',
			'Action',
			'Adventure'
		]);
	});
});
