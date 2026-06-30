import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// ─── Connection Pool ─────────────────────────────────────────────────────────

export const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     Number(process.env.PGPORT)  || 5432,
  database: process.env.PGDATABASE || 'todo_db',
  user:     process.env.PGUSER     || 'postgres',
  password: process.env.PGPASSWORD || '',
});

// ─── Table Initialization ────────────────────────────────────────────────────

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id         VARCHAR(6)   PRIMARY KEY,
      title      TEXT         NOT NULL,
      priority   VARCHAR(10)  NOT NULL DEFAULT 'medium',
      done       BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      done_at    TIMESTAMPTZ
    );
  `);
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

process.on('exit', () => pool.end());
