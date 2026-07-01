import 'dotenv/config';

// ─── 内部状態 ────────────────────────────────────────────────────────────────

let _token = null;

function baseUrl() {
  return process.env.API_BASE_URL || 'http://localhost:3000';
}

// ─── Row Mapper ───────────────────────────────────────────────────────────────

function rowToTodo(row) {
  return {
    id:        row.id,
    title:     row.title,
    priority:  row.priority || 'medium',
    done:      row.completed,
    createdAt: new Date(row.created_at).toLocaleString('ja-JP'),
    doneAt:    row.completed_at
      ? new Date(row.completed_at).toLocaleString('ja-JP')
      : null,
  };
}

// ─── HTTP ヘルパー ────────────────────────────────────────────────────────────

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `APIエラー: ${res.status}`);
  return data;
}

// ─── 認証 ─────────────────────────────────────────────────────────────────────

/**
 * .env の API_EMAIL / API_PASSWORD でログインする。
 * ユーザーが存在しない場合は自動的に新規登録してからログインする。
 */
export async function loginToAPI() {
  const email    = process.env.API_EMAIL;
  const password = process.env.API_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'API_EMAIL と API_PASSWORD を .env に設定してください\n' +
      '  例: API_EMAIL=you@example.com  API_PASSWORD=MyPass1234'
    );
  }

  // ─── ログイン試行 ───────────────────────────────────────────────────────
  const loginRes = await fetch(`${baseUrl()}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    _token = data.token;
    return;
  }

  const loginData = await loginRes.json();

  // 401 = 認証情報の不一致 → 未登録の可能性があるため新規登録を試みる
  if (loginRes.status === 401) {
    const registerRes = await fetch(`${baseUrl()}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    if (registerRes.ok) {
      const data = await registerRes.json();
      _token = data.token;
      return;
    }

    const registerData = await registerRes.json();
    throw new Error(registerData.error || '新規登録に失敗しました');
  }

  throw new Error(loginData.error || 'ログインに失敗しました');
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function loadTodos(filter = 'all') {
  let url = '/api/todos?limit=100&page=1';
  if (filter === 'active') url += '&completed=false';
  if (filter === 'done')   url += '&completed=true';

  const data  = await request('GET', url);
  const todos = data.todos.map(rowToTodo);

  // 優先度・完了状態でソート（DB側ソートに準拠）
  const pOrder = { high: 0, medium: 1, low: 2 };
  return todos.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
  });
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function insertTodo({ title, priority }) {
  const data = await request('POST', '/api/todos', { title, priority });
  return rowToTodo(data.todo);
}

// ─── UPDATE (complete) ───────────────────────────────────────────────────────

export async function markTodoDone(id) {
  const data = await request('PUT', `/api/todos/${id}`, { completed: true });
  return rowToTodo(data.todo);
}

// ─── DELETE (single) ─────────────────────────────────────────────────────────

export async function removeTodo(id) {
  const data = await request('DELETE', `/api/todos/${id}`);
  return rowToTodo(data.todo);
}

// ─── DELETE (completed) ──────────────────────────────────────────────────────

export async function removeCompletedTodos() {
  const data = await request('DELETE', '/api/todos/completed');
  return data.count;
}
