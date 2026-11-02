# 開発規約

## 変更と検証

最新のmainから作業ブランチを作り、既存Issue・PRとの重複を確認します。Draft PRで目的、変更後の動作、検証方法と結果を示してください。ローカルの確認手順は[README](README.md)、PR検証の仕様は[PR validation](docs/features/pr-validation.feature.md)を参照してください。

PRタイトルとコミットはConventional Commitsに従います。例は `fix: 記事リンクを修正する`、`feat: タグによる絞り込みを追加する`、`docs: 開発手順を更新する` です。必要ならscopeを付け、破壊的変更は `!` または `BREAKING CHANGE:` で示します。PRLintはタイトルと本文を1つのコミットメッセージとしてcommitlintで検証します。DependabotのPRはこの検査から除外します。

既存の必須CI、Previewデプロイ、レビューと未解決スレッドを確認し、保護ルールを満たしてsquash mergeします。タイトルと本文は最終的なsquash commitの記録になるため、目的・動作・検証結果を単独で理解できる形に整えてください。リリース公開の仕組みは設けません。

## ラベル

[settings.yml](.github/settings.yml)で標準10ラベル（accessibility、bug、documentation、duplicate、enhancement、good first issue、help wanted、invalid、question、wontfix）をgh-settingsで管理します。既存ラベルはこのリポジトリの実IDで指定します。未宣言の `blog` やDependabot等のラベルと既存の割当は管理外として保持します。ラベルをコミット種別の代わりには使いません。

Issue Formsは不具合に `bug`、機能・改善提案に `enhancement` を付けます。Labelerは変更ファイルがすべて開発文書に一致するときだけ `documentation` を同期します（`sync-labels: true`）。サイトの記事 `src/content/posts/` は公開コンテンツなので対象に含めません。Labelerは他のラベルを操作せず、PRコードをcheckout・実行しません。

## ラベル設定の適用

この導入では自動適用workflowや新しい認証情報を作らず、既存の管理権限を持つGitHub CLIの認証を使って手動で適用します。導入・実API確認に用いたCLIは `daiksud/gh-settings v0.26.0` です。このファイルは同版の `schemaVersion: 1` 形式で、宣言はラベルだけに限定しています。将来CLIを更新するときはスキーマ互換性を先に確認してください。

対象checkoutのoriginが `https://github.com/daiksud/daiksud-me.git` であることと、設定の差分・対象ラベルのID・既存権限を確認してから実行します。

```sh
git remote get-url origin
gh settings validate
gh settings plan
# planが宣言したラベルだけの意図した差分であることを確認後
gh settings apply
gh settings plan
```

applyは新規ラベルのIDをファイルに書き戻すため、その差分をレビューしてコミットします。planとapplyは原子的な操作ではなく、失敗時に部分適用が残り得ます。実ラベルを再取得してID・属性・管理外ラベルと割当を確認してください。設定全体のexport結果を無条件でapplyしたり、削除・権限・セキュリティ・保護設定をこの手順へ混ぜたりしないでください。
