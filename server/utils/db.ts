import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

type Database = ReturnType<typeof createDatabase>

let database: Database | undefined
let warned = false

function createDatabase(connectionString: string) {
  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    prepare: false
  })

  return drizzle(client, { schema })
}

function connectionString() {
  return useRuntimeConfig().databaseUrl || process.env.DATABASE_URL || ''
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
