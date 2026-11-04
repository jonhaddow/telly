// UK days: an episode comes out on a day, whatever the hour.

// Built once: making a formatter costs ~0.1 ms, and Workers' free plan allows
// about 10 ms of CPU per request.
const ukDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD
const dayLabel = new Intl.DateTimeFormat('en-GB', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});

const DAY = 86_400_000;
const time = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** Today's UK date, YYYY-MM-DD. */
export const today = (now = new Date()) => ukDay.format(now);

/** YYYY-MM-DD, a number of days on (or back). */
export const addDays = (day: string, by: number) =>
	new Date(time(day) + by * DAY).toISOString().slice(0, 10);

/** Whole days from one date to a later one. */
export const daysBetween = (from: string, to: string) => Math.round((time(to) - time(from)) / DAY);

/** "Fri 16 Oct" for 2026-10-16. */
export const formatDay = (day: string) =>
	dayLabel.format(new Date(`${day}T12:00:00Z`)).replace(',', '');

/** "Today", "Yesterday", "Tomorrow", "In 3 days", "3 days ago", or the date further out. */
export function relativeDay(day: string, from: string) {
	const n = daysBetween(from, day);
	if (n === 0) return 'Today';
	if (n === 1) return 'Tomorrow';
	if (n === -1) return 'Yesterday';
	if (n > 1 && n < 7) return `In ${n} days`;
	if (n < -1 && n > -14) return `${-n} days ago`;
	return formatDay(day);
}
