/**
 * Database access for the API function.
 *
 * Deployed on Neon Functions it uses node-postgres (`pg`) with a small pooled client, as the Neon
 * Functions skill recommends. `DB_DRIVER=http` switches to Neon's HTTPS SQL endpoint
 * (@neondatabase/serverless), which is only meant for local development on networks that block
 * port 5432.
 */
import { Pool } from 'pg'
import { attachDatabasePool } from '@neon/functions'
import { neon } from '@neondatabase/serverless'

export type QueryResult<T> = { rows: T[]; rowCount: number }
export type Query = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<QueryResult<T>>

function pgQuery(): Query {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  attachDatabasePool(pool)
  return async <T,>(text: string, params: unknown[] = []) => {
    const r = await pool.query(text, params)
    return { rows: r.rows as T[], rowCount: r.rowCount ?? r.rows.length }
  }
}

function httpQuery(): Query {
  const sql = neon(process.env.DATABASE_URL!, { fullResults: true })
  return async <T,>(text: string, params: unknown[] = []) => {
    const r = await sql.query(text, params)
    return { rows: r.rows as T[], rowCount: r.rowCount ?? r.rows.length }
  }
}

export const query: Query = process.env.DB_DRIVER === 'http' ? httpQuery() : pgQuery()
