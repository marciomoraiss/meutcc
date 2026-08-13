CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cohort_id` text NOT NULL,
	`student_email` text NOT NULL,
	`week_key` text NOT NULL,
	`weekly_position` integer NOT NULL,
	`starts_at` text NOT NULL,
	`mode` text DEFAULT 'presencial' NOT NULL,
	`subject` text DEFAULT 'Orientação de TCC' NOT NULL,
	`status` text DEFAULT 'confirmado' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointment_student_week_uq` ON `appointments` (`student_email`,`week_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `appointment_week_position_uq` ON `appointments` (`cohort_id`,`week_key`,`weekly_position`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`course` text NOT NULL,
	`term` text NOT NULL,
	`advisor_email` text NOT NULL,
	`join_code` text NOT NULL,
	`chapter_days` integer DEFAULT 15 NOT NULL,
	`weekly_limit` integer DEFAULT 6 NOT NULL,
	`absent_days` integer DEFAULT 15 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cohorts_join_code_unique` ON `cohorts` (`join_code`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcc_id` integer NOT NULL,
	`kind` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'Pendente' NOT NULL,
	`due_at` text,
	`file_key` text,
	`file_name` text,
	`student_note` text,
	`advisor_note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_tcc_kind_version_uq` ON `deliveries` (`tcc_id`,`kind`,`version`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cohort_id` text NOT NULL,
	`student_email` text NOT NULL,
	`student_number` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_cohort_student_uq` ON `enrollments` (`cohort_id`,`student_email`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcc_id` integer NOT NULL,
	`author_email` text NOT NULL,
	`author_name` text NOT NULL,
	`author_role` text NOT NULL,
	`topic` text DEFAULT 'Orientações gerais' NOT NULL,
	`body` text NOT NULL,
	`file_key` text,
	`file_name` text,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `references` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcc_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`note` text,
	`topic` text DEFAULT 'Orientações gerais' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tccs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cohort_id` text NOT NULL,
	`student_email` text NOT NULL,
	`theme` text DEFAULT 'Tema em definição' NOT NULL,
	`area` text DEFAULT 'Direito Constitucional' NOT NULL,
	`current_stage` text DEFAULT 'Marco 1' NOT NULL,
	`progress` integer DEFAULT 10 NOT NULL,
	`last_contact_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tcc_cohort_student_uq` ON `tccs` (`cohort_id`,`student_email`);