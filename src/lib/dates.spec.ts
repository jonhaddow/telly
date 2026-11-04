import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, relativeDay, today } from './dates.ts';

describe('dates', () => {
	it('uses the UK day', () => {
		// 23:30 UTC in summer is already tomorrow in the UK.
		expect(today(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02');
		expect(today(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-01');
	});

	it('counts days across the clocks changing', () => {
		expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
		expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
	});

	it('describes days near today', () => {
		expect(relativeDay('2026-10-19', '2026-10-19')).toBe('Today');
		expect(relativeDay('2026-10-20', '2026-10-19')).toBe('Tomorrow');
		expect(relativeDay('2026-10-22', '2026-10-19')).toBe('In 3 days');
		expect(relativeDay('2026-10-16', '2026-10-19')).toBe('3 days ago');
		expect(relativeDay('2026-11-19', '2026-10-19')).toBe('Thu 19 Nov');
	});
});
