// The original schema creates the tables referenced by the numbered migrations.
import { Pool } from '@neondatabase/serverless'
import fs from 'node:fs'
if (!process.env.DATABASE_URL && fs.existsSync('.env')) process.loadEnvFile()
const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL missing'); process.exit(1) }
const pool = new Pool({ connectionString: url })
const migrations = fs.readdirSync('db').filter(name => name.endsWith('.sql') && name !== 'studio.sql')
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
const connection = await pool.connect()
try {
  await connection.query('begin')
  for (const name of ['studio.sql', ...migrations]) {
    await connection.query(fs.readFileSync('db/' + name, 'utf8'))
  }
  await connection.query('commit')
  console.log('Applied:', ['studio.sql', ...migrations].join(', '))
} catch {
  await connection.query('rollback')
  throw new Error('Studio migration failed')
} finally {
  connection.release()
  await pool.end()
}
