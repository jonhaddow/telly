CREATE TABLE `service` (
	`provider_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`kind` text NOT NULL,
	`tmdb_id` integer NOT NULL,
	`name` text NOT NULL,
	`years` text,
	`poster` text,
	`watchable_on` text NOT NULL,
	`added_by` integer,
	`added_at` text NOT NULL,
	PRIMARY KEY(`kind`, `tmdb_id`),
	FOREIGN KEY (`added_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `watchlist_added_idx` ON `watchlist` (`added_at`);