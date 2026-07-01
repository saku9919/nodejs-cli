import chalk from 'chalk';
import {
  loadTodos,
  insertTodo,
  markTodoDone,
  removeTodo,
  removeCompletedTodos,
} from './storage.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function priorityLabel(p) {
  if (p === 'high')   return chalk.red.bold('🔴 高');
  if (p === 'medium') return chalk.yellow.bold('🟡 中');
  return chalk.green.bold('🟢 低');
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function addTodo(title, priority = 'medium') {
  return insertTodo({ title, priority }); // ID は API 側で自動生成
}

export async function listTodos(filter = 'all') {
  return loadTodos(filter);
}

export async function completeTodo(id) {
  return markTodoDone(id);
}

export async function deleteTodo(id) {
  return removeTodo(id);
}

export async function clearDone() {
  return removeCompletedTodos();
}

// ─── Display ────────────────────────────────────────────────────────────────

export async function printTodos(filter = 'all') {
  const todos = await listTodos(filter);

  const header = chalk.bold.hex('#A78BFA')('╔══════════════════════════════════════════════╗');
  const footer = chalk.bold.hex('#A78BFA')('╚══════════════════════════════════════════════╝');
  const title  = chalk.bold.hex('#A78BFA')('║') +
                 chalk.bold.hex('#F0ABFC')('          ✅  My Todo List                    ') +
                 chalk.bold.hex('#A78BFA')('║');

  console.log('\n' + header);
  console.log(title);
  console.log(footer);

  if (todos.length === 0) {
    console.log(chalk.dim('\n  タスクがありません。\n'));
    return;
  }

  // DB側でソート済みなのでそのまま表示
  console.log('');
  todos.forEach((todo, i) => {
    const num      = chalk.dim(`${i + 1}.`);
    const id       = chalk.hex('#64748B')(`[${todo.id}]`);
    const status   = todo.done
      ? chalk.green('✓')
      : chalk.hex('#94A3B8')('○');
    const titleText = todo.done
      ? chalk.strikethrough.dim(todo.title)
      : chalk.white.bold(todo.title);
    const pri  = priorityLabel(todo.priority);
    const date = chalk.dim(todo.createdAt);

    console.log(`  ${num} ${status} ${titleText}`);
    console.log(`     ${id}  ${pri}  ${date}`);
    if (todo.done && todo.doneAt) {
      console.log(`     ${chalk.green.dim('完了: ' + todo.doneAt)}`);
    }
    console.log('');
  });

  const total  = todos.length;
  const done   = todos.filter(t => t.done).length;
  const active = total - done;
  const bar    = buildProgressBar(done, total);

  console.log(chalk.dim('  ─────────────────────────────────────────────'));
  console.log(`  ${bar}  ${chalk.cyan.bold(done)}/${chalk.white(total)} 完了  ${chalk.yellow(`残り ${active} 件`)}`);
  console.log('');
}

function buildProgressBar(done, total) {
  const width = 20;
  if (total === 0) return chalk.dim('─'.repeat(width));
  const filled = Math.round((done / total) * width);
  const empty  = width - filled;
  return (
    chalk.hex('#6EE7B7')('█'.repeat(filled)) +
    chalk.dim('░'.repeat(empty))
  );
}
