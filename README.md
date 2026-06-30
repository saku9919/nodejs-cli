# ✅ Node.js Todo CLI

シンプルで美しい、ターミナル用Todoアプリです。

## 📦 インストール

```bash
npm install
```

## 🚀 起動

```bash
npm start
# または
node index.js
```

## 🎮 操作方法

起動するとインタラクティブなメニューが表示されます。

| 操作 | 説明 |
|------|------|
| ➕ タスクを追加する | タイトルと優先度を入力してタスクを追加 |
| ✔ タスクを完了にする | 未完了タスクを選択して完了にする |
| 🗑 タスクを削除する | 任意のタスクを削除する |
| 📋 フィルターで表示 | 全て / 未完了 / 完了済み でフィルタリング |
| 🧹 完了済みをクリア | 完了済みタスクをまとめて削除 |

## 📁 データ保存

タスクは `todos.json` ファイルに自動保存されます。

## 🛠 技術スタック

- [chalk](https://github.com/chalk/chalk) - ターミナルカラー
- [inquirer](https://github.com/SBoudrias/Inquirer.js) - インタラクティブUI
- [nanoid](https://github.com/ai/nanoid) - ユニークID生成
