# Prompt Library

一般的に使用されている生成AI（ChatGPT、Gemini、Claude、Grok 等のLLM）で頻繁に使用するプロンプトを、効率的に再利用するためのブラウザ拡張機能です。
サイト内の入力欄にコマンドトリガー（デフォルト：`#`）を入力すると、プロンプト一覧がサジェスト表示され、選択したプロンプトが即座に挿入されます。

## 主な機能

- **テンプレート管理**: よく使うプロンプトを保存し、カテゴリで整理
- **呼び出し**: コマンドトリガーでプロンプトを即座に挿入
- **変数対応**: `{{変数名}}` 形式で動的な入力欄を作成可能

## インストール

### Chrome ウェブストア経由

1. [Prompt Library - Chrome ウェブストア](#) にアクセス
2. 「ブラウザに追加」をクリック
3. 拡張機能アイコンから設定を開き、テンプレートを作成

## 使い方

### 1. プロンプトを挿入する

1. 対応サイトの入力欄でコマンドトリガー（`#`）を入力
2. 表示されるサジェストからテンプレートを選択
3. 変数がある場合は値を入力
4. 必要に応じて編集し、送信

### 2. テンプレートを作成する

1. 拡張機能のオプションページを開く
2. 「新規テンプレート作成」を選択
3. 以下を設定:
   - **タイトル**: テンプレート名
   - **内容**: プロンプト本文（変数は `{{説明}}` の形式で記述）
4. 保存

### 3. テンプレートを管理する

オプションページから以下の操作が可能:
- テンプレートの編集・削除
- カテゴリの変更・追加
- 表示順の調整

## 対応サイト

| サイト名 | URL |
| ---- | ---- |
| ChatGPT | https://chatgpt.com/ |
| Gemini | https://gemini.google.com/ |
| NotebookLM | https://notebooklm.google.com/ |
| Claude | https://claude.ai/ |
| Grok | https://grok.com/ |
| Copilot | https://copilot.microsoft.com/ |
| Github Copilot | https://copilot.github.com/ |
| Genspark | https://genspark.ai/ |
| DeepSeek | https://chat.deepseek.com/ |

### 現在未対応

以下のサイトはリッチテキストエディタの仕様により未対応です（今後のアップデートで対応予定）:
- Perplexity
- Notion AI

## フィードバック・問題報告

不具合や機能要望は [GitHub Issues](https://github.com/ta-ku44/PromptLibrary/issues) までお願いします。