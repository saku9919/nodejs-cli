#!/usr/bin/env node
import 'dotenv/config';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loginToAPI } from './storage.js';
import {
  addTodo,
  printTodos,
  completeTodo,
  deleteTodo,
  clearDone,
  listTodos,
} from './todos.js';

// ─── Banner ─────────────────────────────────────────────────────────────────

function showBanner() {
  console.clear();
  console.log(chalk.hex('#A78BFA').bold(`
  ████████╗ ██████╗ ██████╗  ██████╗ 
     ██╔══╝██╔═══██╗██╔══██╗██╔═══██╗
     ██║   ██║   ██║██║  ██║██║   ██║
     ██║   ██║   ██║██║  ██║██║   ██║
     ██║   ╚██████╔╝██████╔╝╚██████╔╝
     ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝ 
  `));
  console.log(chalk.hex('#C4B5FD')('  Node.js Todo CLI  ') + chalk.dim('v1.0.0') + '\n');
}

// ─── Menu ────────────────────────────────────────────────────────────────────

async function mainMenu() {
  showBanner();
  await printTodos();

  const { action } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'action',
      message: chalk.cyan.bold('何をしますか？'),
      choices: [
        { name: chalk.green('  ➕  タスクを追加する'),    value: 'add' },
        { name: chalk.yellow('  ✔   タスクを完了にする'), value: 'complete' },
        { name: chalk.red('  🗑   タスクを削除する'),     value: 'delete' },
        { name: chalk.blue('  📋  フィルターで表示'),    value: 'filter' },
        { name: chalk.magenta('  🧹  完了済みをクリア'), value: 'clear' },
        { name: chalk.dim('  ✖   終了'),               value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'add':      await handleAdd();      break;
    case 'complete': await handleComplete(); break;
    case 'delete':   await handleDelete();   break;
    case 'filter':   await handleFilter();   break;
    case 'clear':    await handleClear();    break;
    case 'exit':
      console.log(chalk.hex('#A78BFA').bold('\n  👋 またね！\n'));
      process.exit(0);
  }

  // Loop back
  await mainMenu();
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleAdd() {
  console.log('');
  const { title, priority } = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: chalk.green('タスク名を入力してください:'),
      validate: (v) => v.trim().length > 0 ? true : 'タスク名を入力してください',
    },
    {
      type: 'rawlist',
      name: 'priority',
      message: chalk.green('優先度を選択してください:'),
      choices: [
        { name: chalk.red('🔴 高'),    value: 'high' },
        { name: chalk.yellow('🟡 中'), value: 'medium' },
        { name: chalk.green('🟢 低'),  value: 'low' },
      ],
      default: 'medium',
    },
  ]);

  const todo = addTodo(title.trim(), priority);
  console.log(
    chalk.green.bold(`\n  ✅ 追加しました: `) +
    chalk.white.bold(todo.title) +
    chalk.dim(` [${todo.id}]\n`)
  );
  await pause();
}

async function handleComplete() {
  const todos = await listTodos('active');
  if (todos.length === 0) {
    console.log(chalk.yellow('\n  完了できるタスクがありません。\n'));
    await pause();
    return;
  }

  const { id } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'id',
      message: chalk.yellow('完了にするタスクを選択してください:'),
      choices: todos.map(t => ({
        name: `${priorityIcon(t.priority)} ${t.title} ${chalk.dim(`[${t.id}]`)}`,
        value: t.id,
      })),
    },
  ]);

  const todo = completeTodo(id);
  console.log(
    chalk.green.bold(`\n  🎉 完了しました: `) +
    chalk.strikethrough.dim(todo.title) + '\n'
  );
  await pause();
}

async function handleDelete() {
  const todos = await listTodos('all');
  if (todos.length === 0) {
    console.log(chalk.yellow('\n  削除できるタスクがありません。\n'));
    await pause();
    return;
  }

  const { id } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'id',
      message: chalk.red('削除するタスクを選択してください:'),
      choices: todos.map(t => ({
        name: `${t.done ? '✓' : '○'} ${t.title} ${chalk.dim(`[${t.id}]`)}`,
        value: t.id,
      })),
    },
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.red('本当に削除しますか？'),
      default: false,
    },
  ]);

  if (confirm) {
    const todo = deleteTodo(id);
    console.log(
      chalk.red.bold(`\n  🗑  削除しました: `) +
      chalk.dim(todo.title) + '\n'
    );
  } else {
    console.log(chalk.dim('\n  キャンセルしました。\n'));
  }
  await pause();
}

async function handleFilter() {
  const { filter } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'filter',
      message: chalk.blue('表示するタスクを選択してください:'),
      choices: [
        { name: '📋 すべて',     value: 'all' },
        { name: '○  未完了のみ', value: 'active' },
        { name: '✓  完了済みのみ', value: 'done' },
      ],
    },
  ]);

  console.clear();
  await printTodos(filter);
  await pause();
}

async function handleClear() {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.magenta('完了済みのタスクをすべて削除しますか？'),
      default: false,
    },
  ]);

  if (confirm) {
    const count = clearDone();
    console.log(
      chalk.magenta.bold(`\n  🧹 ${count} 件の完了済みタスクを削除しました。\n`)
    );
  } else {
    console.log(chalk.dim('\n  キャンセルしました。\n'));
  }
  await pause();
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function priorityIcon(p) {
  if (p === 'high')   return '🔴';
  if (p === 'medium') return '🟡';
  return '🟢';
}

async function pause() {
  await inquirer.prompt([
    {
      type: 'input',
      name: '_',
      message: chalk.dim('Enterキーでメニューに戻る...'),
    },
  ]);
}

// ─── Start ───────────────────────────────────────────────────────────────────

async function start() {
  try {
    await loginToAPI();
  } catch (err) {
    console.error(chalk.red.bold('\n  ❌ API ログインエラー:'), err.message);
    console.error(chalk.dim('  .env の API_BASE_URL / API_EMAIL / API_PASSWORD を確認してください。'));
    process.exit(1);
  }
  mainMenu().catch(err => {
    console.error(chalk.red('\nエラーが発生しました:'), err.message);
    process.exit(1);
  });
}

start();
