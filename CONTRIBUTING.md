# 開発規約

## 変更と検証

最新のmainから作業ブランチを作り、既存Issue・PRとの重複を確認します。Draft PRで目的、変更後の動作、検証方法と結果を示してください。ローカルの確認手順は[README](README.md)、PR検証の仕様は[PR validation](docs/features/pr-validation.feature.md)を参照してください。

PRタイトルとコミットはConventional Commitsに従います。例は `fix: 記事リンクを修正する`、`feat: タグによる絞り込みを追加する`、`docs: 開発手順を更新する` です。必要ならscopeを付け、破壊的変更は `!` または `BREAKING CHANGE:` で示します。PRLintはタイトルと本文を1つのコミットメッセージとしてcommitlintで検証します。DependabotのPRはこの検査から除外します。

既存の必須CI、Previewデプロイ、レビューと未解決スレッドを確認し、保護ルールを満たしてsquash mergeします。タイトルと本文は最終的なsquash commitの記録になるため、目的・動作・検証結果を単独で理解できる形に整えてください。リリース公開の仕組みは設けません。

## ラベル

[settings.yml](.github/settings.yml)で標準10ラベル（accessibility、bug、documentation、duplicate、enhancement、good first issue、help wanted、invalid、question、wontfix）をgh-settingsで管理します。既存ラベルはこのリポジトリの実IDで指定します。未宣言の `blog` やDependabot等のラベルと既存の割当は管理外として保持します。ラベルをコミット種別の代わりには使いません。

Issue Formsは不具合に `bug`、機能・改善提案に `enhancement` を付けます。Labelerは変更ファイルがすべて開発文書に一致するときだけ `documentation` を同期します（`sync-labels: true`）。サイトの記事 `src/content/posts/` は公開コンテンツなので対象に含めません。Labelerは他のラベルを操作せず、PRコードをcheckout・実行しません。無関係なラベルを同時に外した際の復元を避けるため、[上流の個別操作への修正](https://github.com/actions/labeler/commit/b7a88044754812b108a54feec878dd5c328bba59)にSHA固定しています（v7.0.0後の未タグ修正）。

## ラベル設定の適用

この導入では自動適用workflowや新しい認証情報を作らず、既存の管理権限を持つGitHub CLIの認証を使って手動で適用します。設定ファイルはgh-settings v0.29.0の `version: daiksud/gh-settings@v0` 形式です。管理対象は既存の10ラベルだけに限定します。PRではSHA固定の `settings-pr` ワークフローが同バージョンで `validate` を実行します。`validate` はGitHub上の実設定を読み取らず、差分確認や適用もしません。

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
