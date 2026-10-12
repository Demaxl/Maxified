CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waitlist_id" uuid,
	"email" text,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"email" text NOT NULL,
	"source" text DEFAULT 'waitlist_section' NOT NULL,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_waitlist_id_waitlist_subscribers_id_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."waitlist_subscribers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_responses_email_idx" ON "survey_responses" USING btree ("email");--> statement-breakpoint
CREATE INDEX "survey_responses_created_at_idx" ON "survey_responses" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_subscribers_email_key" ON "waitlist_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_subscribers_created_at_idx" ON "waitlist_subscribers" USING btree ("created_at");