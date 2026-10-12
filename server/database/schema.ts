import { sql } from 'drizzle-orm'
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const waitlistSubscribers = pgTable('waitlist_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Optional: a signup only requires an email address. */
  firstName: text('first_name'),
  email: text('email').notNull(),
  source: text('source').notNull().default('waitlist_section'),
  /** Set once an external email service has accepted the subscriber. */
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  uniqueIndex('waitlist_subscribers_email_key').on(table.email),
  index('waitlist_subscribers_created_at_idx').on(table.createdAt)
])

export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  waitlistId: uuid('waitlist_id').references(() => waitlistSubscribers.id, { onDelete: 'set null' }),
  email: text('email'),
  answers: jsonb('answers').notNull().default(sql`'{}'::jsonb`),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  index('survey_responses_email_idx').on(table.email),
  index('survey_responses_created_at_idx').on(table.createdAt)
])

export type WaitlistSubscriber = typeof waitlistSubscribers.$inferSelect
export type SurveyResponse = typeof surveyResponses.$inferSelect
