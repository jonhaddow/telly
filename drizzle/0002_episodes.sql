CREATE TABLE `episode_watch` (
	`show_id` integer NOT NULL,
	`season` integer NOT NULL,
	`episode` integer NOT NULL,
	`watched_by` integer,
	`watched_at` text NOT NULL,
	PRIMARY KEY(`show_id`, `season`, `episode`),
	FOREIGN KEY (`watched_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `watchlist` ADD `next_season` integer;--> statement-breakpoint
ALTER TABLE `watchlist` ADD `next_episode` integer;--> statement-breakpoint
ALTER TABLE `watchlist` ADD `next_name` text;--> statement-breakpoint
ALTER TABLE `watchlist` ADD `next_air_date` text;--> statement-breakpoint
ALTER TABLE `watchlist` ADD `next_still` text;--> statement-breakpoint
ALTER TABLE `watchlist` ADD `watched_at` text;