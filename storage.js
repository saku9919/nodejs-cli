import { pool } from './db.js';

// ─── Row mapper ──────────────────────────────────────────────────────────────

function rowToTodo(row) {
  return {
    id:        row.id,
    title:     row.title,
    priority:  row.priority,
    done:      row.done,
    createdAt: new Date(row.created_at).toLocaleString('ja-JP'),
    doneAt:    row.done_at ? new Date(row.done_at).toLocaleString('ja-JP') : null,
  };
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function loadTodos(filter = 'all') {
  let query = 'SELECT * FROM todos';
  if (filter === 'active') query += ' WHERE done = FALSE';
  if (filter === 'done')   query += ' WHERE done = TRUE';
  query += ' ORDER BY done ASC, CASE priority WHEN \'high\' THEN 0 WHEN \'medium\' THEN 1 ELSE 2 END ASC, created_at ASC';

  const { rows } = await pool.query(query);
  return rows.map(rowToTodo);
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function insertTodo({ id, title, priority }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (id, title, priority)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, title, priority]
  );
  return rowToTodo(rows[0]);
}

// ─── UPDATE (complete) ───────────────────────────────────────────────────────

export async function markTodoDone(id) {
  const { rows } = await pool.query(
    `UPDATE todos
     SET done = TRUE, done_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows.length ? rowToTodo(rows[0]) : null;
}

// ─── DELETE (single) ─────────────────────────────────────────────────────────

export async function removeTodo(id) {
  const { rows } = await pool.query(
    `DELETE FROM todos
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows.length ? rowToTodo(rows[0]) : null;
}

// ─── DELETE (completed) ──────────────────────────────────────────────────────

export async function removeCompletedTodos() {
  const { rowCount } = await pool.query(
    `DELETE FROM todos WHERE done = TRUE`
  );
  return rowCount;
}
