CREATE TABLE `tasting_logs` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`selected_tags` text,
	`free_text` text,
	`suggested_wine_id` integer,
	FOREIGN KEY (`suggested_wine_id`) REFERENCES `wines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wines` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`price_range` text NOT NULL,
	`country` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL
);
