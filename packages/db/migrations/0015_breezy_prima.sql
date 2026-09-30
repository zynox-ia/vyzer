CREATE TYPE "public"."member_code_font_size" AS ENUM('smaller', 'small', 'default', 'large', 'larger');--> statement-breakpoint
CREATE TYPE "public"."member_code_line_height" AS ENUM('compact', 'regular', 'relaxed');--> statement-breakpoint
CREATE TYPE "public"."member_code_theme" AS ENUM('linear-dark', 'linear-colorblind', 'linear-midnight', 'andromeda', 'atom-one-dark', 'ayu-dark', 'ayu-mirage', 'catppuccin-frappe', 'catppuccin-macchiato', 'catppuccin-mocha', 'cobalt2', 'darcula', 'dracula', 'edge-dark', 'everforest-dark', 'github-dark', 'github-dark-dimmed', 'gruvbox-dark', 'halcyon', 'houston', 'iceberg-dark', 'modern-dark', 'night-owl', 'nord', 'one-dark-pro', 'one-monokai', 'palenight', 'rose-pine', 'rose-pine-moon', 'shades-of-purple', 'solarized-dark', 'sonokai', 'synthwave-84', 'tokyo-night', 'vitesse-dark');--> statement-breakpoint
CREATE TYPE "public"."member_default_home_view" AS ENUM('agent', 'inbox', 'my-issues', 'reviews', 'all-issues', 'active-issues', 'current-cycle', 'projects');--> statement-breakpoint
CREATE TYPE "public"."member_display_name_format" AS ENUM('full', 'first');--> statement-breakpoint
CREATE TYPE "public"."member_first_day_of_week" AS ENUM('sunday', 'monday');--> statement-breakpoint
CREATE TYPE "public"."member_interface_font_size" AS ENUM('small', 'default', 'large');--> statement-breakpoint
CREATE TYPE "public"."member_interface_theme" AS ENUM('system', 'light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."member_send_comments_on" AS ENUM('enter', 'mod-enter');--> statement-breakpoint
CREATE TABLE "member_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"default_home_view" "member_default_home_view" DEFAULT 'agent' NOT NULL,
	"display_name_format" "member_display_name_format" DEFAULT 'full' NOT NULL,
	"first_day_of_week" "member_first_day_of_week" DEFAULT 'sunday' NOT NULL,
	"convert_emoticons" boolean DEFAULT true NOT NULL,
	"send_comments_on" "member_send_comments_on" DEFAULT 'enter' NOT NULL,
	"interface_font_size" "member_interface_font_size" DEFAULT 'default' NOT NULL,
	"use_pointer_cursors" boolean DEFAULT false NOT NULL,
	"underline_links" boolean DEFAULT false NOT NULL,
	"disable_animated_images" boolean DEFAULT false NOT NULL,
	"interface_theme" "member_interface_theme" DEFAULT 'system' NOT NULL,
	"code_theme" "member_code_theme" DEFAULT 'linear-dark' NOT NULL,
	"code_font_size" "member_code_font_size" DEFAULT 'default' NOT NULL,
	"code_line_height" "member_code_line_height" DEFAULT 'regular' NOT NULL,
	"code_font_family" text DEFAULT '' NOT NULL,
	"open_in_desktop_app" boolean DEFAULT false NOT NULL,
	"auto_assign_to_self" boolean DEFAULT false NOT NULL,
	"auto_assign_on_move_to_started" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_preference" ADD CONSTRAINT "member_preference_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_preference" ADD CONSTRAINT "member_preference_member_workspace_fk" FOREIGN KEY ("member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_preference_member_unique" ON "member_preference" USING btree ("member_id");