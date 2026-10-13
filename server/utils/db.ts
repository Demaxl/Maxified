import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../database/schema'

type Database = ReturnType<typeof createDatabase>

let database: Database | undefined
let warned = false

/**
 * Neon's HTTP driver sends each query as its own request, so no connection is held
 * open between requests. Cloudflare Workers can't reuse a socket across requests,
 * which rules out a pooled TCP client there. No interactive transactions over HTTP.
 */
function createDatabase(connectionString: string) {
  return drizzle({ client: neon(connectionString), schema })
}

/**
 * Read lazily, never at module load: on Cloudflare `process.env` is only filled in
 * per request, and the event-less runtime config is frozen before that happens.
 */
function connectionString() {
  return process.env.DATABASE_URL || useRuntimeConfig().databaseUrl || ''
}

export function isDatabaseConfigured() {
  return Boolean(connectionString())
}

export function useDatabase() {
  const url = connectionString()

  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!database) {
    database = createDatabase(url)
  }

  return database
}

/**
 * Without a database the site still has to demo end to end, so submissions fall
 * back to Nitro storage. That fallback is local-only and is never used once
 * DATABASE_URL is set.
 */
export function warnAboutMissingDatabase() {
  if (warned) {
    return
  }

  warned = true
  console.warn('[maxi-fitness] DATABASE_URL is not set — submissions are being written to local Nitro storage instead of Postgres.')
}

export { schema }
