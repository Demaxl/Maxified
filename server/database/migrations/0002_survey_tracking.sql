CREATE TABLE "survey_starts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_responses" ADD COLUMN "start_id" uuid;--> statement-breakpoint
CREATE INDEX "survey_starts_created_at_idx" ON "survey_starts" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_start_id_survey_starts_id_fk" FOREIGN KEY ("start_id") REFERENCES "public"."survey_starts"("id") ON DELETE set null ON UPDATE no action;