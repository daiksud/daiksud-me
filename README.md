---
type: Guide
title: daiksud.meサイトのビルド
description: Astro製の静的サイトの概要と、チェック・テスト・ビルドの手順。
---

## daiksud.me

Astroで構築した静的サイトです。ビルドの出力先は `dist/` です。Cloudflareへのデプロイ設定は [wrangler.jsonc](wrangler.jsonc) で管理します。

サイトとドキュメントの主言語は日本語です。画面の案内、読み上げ用ラベル、ページ情報を日本語で揃え、ブランド名、コマンド、URL、設定キー、タグのslugは元の表記を維持します。

本番のオリジンは <https://daiksud.me> で、Astroの `site` 設定に集約しています。DNSとCloudflareのカスタムドメイン設定は、この設定とは別に管理します。

リポジトリは [daiksud/daiksud-me](https://github.com/daiksud/daiksud-me) です。GitHubの所有者・リポジトリ名とは独立して、Cloudflare Worker名は `daiksud-me`、ビルドCheck名は `Workers Builds: daiksud-me`、PreviewのURLは `*-daiksud-me.daiksud-a1f.workers.dev` を使用します。

開発時のPR・コミット・ラベルと設定適用の手順は[開発規約](CONTRIBUTING.md)を参照してください。

### ホーム画面の設計用語

[tmuxのペイン](https://github.com/tmux/tmux/wiki/Getting-Started#sessions-windows-and-panes)と[herdrのペイン](https://herdr.dev/docs/concepts/#pane)にならい、ホーム画面で区切られたコンテンツ領域を**ペイン**と呼びます。画面の説明、設計、CSS、テストでこの用語を統一して使います。

| 名称 | 役割 | CSSクラス |
| --- | --- | --- |
| サイドバーペイン | サイト内の4ページへのナビゲーションとタグ | `sidebar-pane` |
| ウェルカムペイン | ターミナル風の導入、サイトの概要、lsコマンドの出力を模したページ内目次 | `welcome-pane` |
| 記事ペイン | 最新記事。公開済みの記事がない場合は、その状態を表示 | `posts-pane` |
| 自己紹介ペイン | アバター、名前、所在地、短い自己紹介、詳しいプロフィールへのリンク | `about-pane` |
| コミットペイン | GitHubの変更履歴へのリンク | `commits-pane` |
| フッターペイン | 締めのプロンプト、GitHub / X / Zennへのリンク、著作権表示 | `footer-pane` |

共通の外側のコンテナは `pane`、内部の共通要素は `pane-heading` / `pane-label` / `pane-link` / `pane-footnote` です。ホーム画面は6つのペインで構成し、すべて `src/components/Pane.astro` を使います。サイドバーペインとフッターペインは `aside` / `footer` を使い、サイト共通レイアウトのGrid Areaである `sidebar` / `footer` に配置します。残りの4つは `section` を使い、`dashboard` 直下のGrid Itemとして配置します。ウェルカムペインは独立したペイン見出しを置かず、コマンド行とページの `h1` から始めます。ほかの3つには共通のペイン見出しを表示します。サイト全体のヘッダーは上部バーであり、ペインとは区別します。

ホームは画面幅に合わせて広げます。ヘッダーとフッターは全ページで画面の左右端まで表示します。画面幅1280px以上では左端に幅240pxのサイドバーを置き、メイン領域はその右側の幅を使います。メイン領域と画面右端の余白は12px、ペイン間の間隔は16pxです。それより狭い画面では共通ナビゲーションを本文の上に移し、メイン領域の左右に12pxの余白を設けます。

ホームではウェルカムペインと記事ペインをこの順にメイン領域の全幅で表示します。その下に自己紹介とコミットを配置し、画面幅1000px以上では横に並べ、それより狭い画面では縦に並べます。各ペインは内容に応じた高さにし、下端を揃えるために引き伸ばしません。

共通ナビゲーションの対象は、ホーム `/`、記事一覧 `/posts`、タグ一覧 `/tags`、プロフィール `/profile` の4ページです。画面幅1280px以上ではサイドバーペインに、それより狭い画面では本文の上にあるサイトメニューに表示します。ヘッダーにはブランド名とタグラインを表示します。ウェルカムペインのページ内目次は `ls` コマンドの出力を模し、最新記事 `#posts`、自己紹介 `#about`、最近のコミット `#commits` の順にリンクします。リンクには `#` を表示して現在のページの選択状態と区別し、リンク先にはキーボードフォーカスも移せます。共通のGitHub / X / Zennリンクはフッターペインに表示します。詳しい受入条件は[サイトナビゲーションとホーム画面の目次](docs/features/navigation.feature.md)を参照してください。

これらはブログUIの設計用語です。実際のターミナルやセッション管理、ペインの分割・移動・サイズ変更の機能を意味するものではありません。サイト名 `daiksud.me`、プロンプト `daiksud@kawasaki:~$`、所在地 `Kawasaki, Japan` はそのまま維持します。

### 記事ページ

記事は `src/content/posts/<slug>.md` に配置します。AstroのContent Collectionが `/<slug>` に静的ページを生成します。`/posts` にはすべての記事を `publishedAt` の降順で表示します。

個別の記事はすべて共通の記事レイアウトを使います。記事ペインの見出しは表示せず、冒頭にターミナルのコマンド行 `cat <slug>.md` を表示します。プロフィールも `profile.md` から `/profile` に生成し、`cat profile.md` を表示します。プロフィールの日付、タグ、一覧への掲載には、ほかの記事と同じルールを適用します。プロフィールメニューのリンク先は `/profile` です。ホーム画面の短い自己紹介は自己紹介ペインに表示し、詳しいプロフィールへのリンクを添えます。

本文にh2またはh3の見出しが2件以上ある記事には目次を表示します。画面幅1000px以上では、記事の右側に幅208pxの独立したペインを置き、スクロールに追従させます。それより狭い画面では、ヘッダーと本文の間に「この記事の目次」を開閉できる形で表示します。詳しい受入条件は[記事の目次](docs/features/table-of-contents.feature.md)を参照してください。

既存の一覧ページ `/posts` と `/tags` を保護するため、記事名が `posts` または `tags` の場合はビルドエラーにします。旧パス `/posts/<slug>` にはページもリダイレクトも生成しません。詳しい受入条件は[個別記事のルートと共通表示](docs/features/posts.feature.md)を参照してください。

frontmatterは次の形式で記述します。

```yaml
---
title: 記事タイトル
description: 記事の概要
publishedAt: 2026-10-01
updatedAt: 2026-10-02 # 任意
tags:
  - astro
  - development
---
```

`slug` はfrontmatterに重複して記述せず、Markdownのファイル名をそのまま使います。記事タイトルはレイアウトが `h1` として表示するため、Markdown本文に `#` 見出しは使いません。本文の見出しは `##` から始めます。

### RSS購読

共通フッターから `/rss.xml` にリンクし、各ページのHTMLのheadにもフィードを検出できるよう `https://daiksud.me/rss.xml` を記載します。静的フィードには、プロフィールを含む `/posts` と同じ記事の概要を、公開日の新しい順に掲載します。記事リンクとGUIDには、ローカルビルドやPreviewビルドでも本番のオリジンを使い、末尾のスラッシュを付けません。概要や更新日を編集しても、元の公開日とフィード上の識別情報は維持します。

受入条件は[RSSの購読と検出](docs/features/rss.feature.md)を参照してください。フィードには記事全文のHTMLを含めません。読者はフィードのリンクから元の記事を開きます。

### タグの定義

使用できるタグは [src/content/tags.yaml](src/content/tags.yaml) の `catalog.tags` 配列に定義します。各記事のfrontmatterの `tags` には、定義済みの `slug` を指定します。

```yaml
catalog:
  tags:
    - slug: astro
      tone: blue
    - slug: development
      tone: pink
```

`slug` と `tone` はどちらも必須です。同じ `slug` を複数回定義するとビルドエラーになります。`tone` に指定できる値は `blue` / `purple` / `green` / `pink` / `yellow` / `orange` / `cyan` / `muted` です。新しいタグを記事で使う前に、タグ定義に追加してください。未定義のタグを使う記事が1つでもあれば、その記事とタグを示すエラーでビルドが失敗します。

タグ一覧と共通サイドバーには使用中のタグだけを表示します。ホームのタグも共通サイドバーに集約し、画面幅1280px未満では共通ナビゲーションの「タグ一覧」から移動します。タグは参照する記事数の降順に並べ、記事数が同じ場合は `slug` の昇順に並べます。YAMLの配列での順序は表示順に影響しません。

詳しい受入条件は[記事のタグ定義と参照](docs/behavior/tags.feature.md)、用語の定義は[ブログの用語集](docs/glossary.md)を参照してください。

### 日本語の組版

日本語の本文には `word-break: auto-phrase` を使い、未対応ブラウザ向けのフォールバックとして、その前に `word-break: normal` を指定します。自動的な文節の検出だけに頼らず、意図した位置で改行できるよう、必要に応じて `<wbr>` を明示します。

見出しには、文字間を詰める `font-feature-settings: "palt"` と `text-wrap: balance` を使います。本文には `balance` を適用しません。通常の本文はペインの利用可能な幅をそのまま使い、明確な理由なしに固定の `max-width` を設定しません。

記事のヘッダー、本文、下部ナビゲーションは共通の左右余白を使い、それぞれに幅の上限を設けません。記事ペインの基本の内側余白は24pxです。本文は画面幅1280px以上で18px、それより狭い画面で16pxにし、行高は1.85にします。記事タイトルは最大36px、ヘッダーのタグラインは14pxです。

参考: https://developer.chrome.com/blog/css-i18n-features

### テストとビルド

依存関係のインストール、Astroの開発・ビルド、テストにはNode.jsとpnpmを使います。Node.jsのバージョンは [.node-version](.node-version) だけで指定します。[mise.toml](mise.toml) の `idiomatic_version_file_enable_tools = ["node", "pnpm"]` により、miseはNode.jsをこのファイルから、pnpmをpackage.jsonから読み取ります。GitHub Actionsのsetup-nodeは `node-version-file: .node-version`、Cloudflare Workers Buildsは標準のバージョンファイル検出で同じ指定を使います。mise.tomlの `tools.node` やpackage.jsonの `engines.node` にバージョンを重複指定しないでください。miseの[Node.jsバージョンファイルの仕様](https://mise.jdx.dev/lang/node.html#version-files)を参照してください。

pnpmのバージョンは [package.json](package.json) の `packageManager` だけで指定し、依存関係は [pnpm-lock.yaml](pnpm-lock.yaml) で固定します。mise.tomlの `tools.pnpm` やActionsの `version` にpnpmのバージョンを重複指定しないでください。Actionsはpnpm/action-setupでpnpmを用意してからsetup-nodeの `cache: pnpm` を使います。pnpm/action-setup側のキャッシュは有効にしません。Corepackや独自のバージョン抽出スクリプトは不要です。

[pnpm-workspace.yaml](pnpm-workspace.yaml) の `saveExact: true` により、依存関係を追加するときも完全一致で保存します。`allowBuilds` は必要なesbuild・workerdのバージョンだけにインストールスクリプトを許可し、fseventsは実行しません。型チェックには `astro check` を使い、`.astro` ファイルも対象にします。WranglerもNode.jsで実行します。デプロイ記録用ワークフローは、信頼済みのチェックアウトにある `.node-version` からNode.jsを用意し、外部依存のないURLヘルパーを実行します。

```sh
mise trust mise.toml
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm run check
mise exec -- pnpm run build
mise exec -- pnpm run test:unit
```

ローカルのAstro開発サーバーは `mise exec -- pnpm run dev` で起動します。コミットメッセージは、package.jsonの開発依存にあるcommitlintを `mise exec -- pnpm run commitlint` で実行して検証できます。

テストは、入力と観測可能な結果を通じて公開インターフェースの契約を守ります。単体テストでは日付、タイトル、記事の並び順、コンテンツに基づくタグを検証します。フィクスチャを使う結合テストでは、有効なコンテンツをビルドし、タグの重複、古い記事にある未定義タグ、ルートの衝突に対するビルド時の診断を検証します。そのブラウザ検証では、隔離したフィクスチャコンテンツを使い、Markdownの読みやすさ、メタデータ、記事・タグの並び順、ナビゲーションを確認します。ソースの文面、YAMLの構造、生のHTML/CSS、クラス、生成された識別子、内部の呼び出し順序はテストで固定しません。受入テストの実行処理、ブラウザのアサーション、スモークチェック自体を対象にしたテストは設けません。

### ブラウザでの受入テスト

読者向けのシナリオは [`docs/features`](docs/features) に日本語で記載します。執筆者向けのタグ定義と不正な参照のルールは [`docs/behavior/tags.feature.md`](docs/behavior/tags.feature.md) に記載します。`pnpm run test` はVitestで、公開インターフェースの単体テストとフィクスチャを使う結合テストを実行します。`test:unit` は公開インターフェースに対する高速なテスト、`test:integration` は [`tests/content.build.test.mjs`](tests/content.build.test.mjs) と、その中で実際にブラウザを使うフィクスチャ検証を実行します。`test`、`test:integration`、受入テストを実行する前にChromiumをインストールしてください。`test:ci` は別のテストで、プロバイダーとデプロイの情報を入力し、返される結果からPreviewの選択・拒否を検証します。

Playwrightのバージョンはロックファイルで固定しています。受入テストの前に、対応するChromium shellをインストールしてください。

```sh
mise exec -- pnpm run test:ci
mise exec -- pnpm exec playwright install --only-shell chromium
mise exec -- pnpm run test
mise exec -- pnpm run test:acceptance
mise exec -- pnpm run test:acceptance "$PREVIEW_URL"
```

Linuxでブラウザに必要なシステム依存関係がない場合は、Playwrightの `install --with-deps --only-shell chromium` を使います。受入テストのコマンドは検証前にローカルの `dist` をビルドし、フィクスチャを使う結合テストと、画面幅1920・1440・1280・1279・1000・999・390ピクセルでのローカルの読者操作を実行します。デプロイ記録と一致する `PREVIEW_URL` を指定すると、デプロイ済みPreviewに対しても同じ操作を検証します。PRのCIではこのURLの指定が必須です。mainへのpush時の受入テストではローカルビルドを使います。

受入テストは1回だけ実行し、実行エラーや期待値との不一致があればそのまま失敗にします。コマンドログは `test-results/acceptance` 以下に保存します。ブラウザ検証が失敗した場合は、対応するローカルまたはPreviewのディレクトリにスクリーンショットとトレースを保存します。フィクスチャコンテンツの診断には `fixtures-populated` と `fixtures-empty`、サイトの操作シナリオには `local` と `preview` の各ディレクトリを使います。レイアウトの寸法を調べるヘルパーは読者の操作シナリオから呼び出し、専用のサーバーやブラウザコマンドは設けません。フォーカスと選択状態の見え方は、基準画像を使わず、その時点で描画した状態どうしを比較します。[受入シナリオ](docs/features/acceptance.feature.md)を参照してください。

初期のスモークチェックは別に実行します。[`test:smoke`](scripts/ci/smoke.mjs) は一致するPreviewの `/` だけにリクエストし、制限時間内にHTTP 200が返ることを要求します。リダイレクトの追跡やコンテンツの検査は行いません。

### Cloudflare Workers Buildsの設定

Workerの **Settings → Build** で、build commandを `pnpm run build` に設定します。deploy commandは本番・Previewそれぞれの既存のWranglerサブコマンドとオプションを保ち、`pnpm exec wrangler ...` で実行する形に揃えます。これらはCloudflare側の外部設定なので、リポジトリのファイルを変更しても更新されません。移行前に、実際のbuild/deploy commandを確認してください。

Workers Buildsは [pnpm-lock.yaml](pnpm-lock.yaml) からpnpmを選び、package.jsonの `packageManager` からpnpmのバージョンを選びます。Node.jsは `.node-version` を読み取ります。Cloudflare側の `NODE_VERSION`・`PNPM_VERSION` と、依存インストールを省略する `SKIP_DEPENDENCY_INSTALL` の設定も確認してください。Node.jsの上書きや古いインストール・デプロイコマンドが残ると、ローカル・CIと異なる環境になったり、Preview・本番のビルドが失敗したりする可能性があります。既定のCorepack設定ではpnpmの `packageManager` は `PNPM_VERSION` より優先されますが、移行時には外部設定と実際のビルドログで、使用されたNode.js・pnpm・各コマンドを確認してください。Cloudflareの[ビルド設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)と[ビルドイメージ・バージョンの選択](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)を参照してください。

### Codexの承認自動化とRulesetsの責務

[承認ワークフロー](.github/workflows/approve-codex-review.yml)は、[gh-settings #554](https://github.com/daiksud/gh-settings/pull/554)と同じ次の条件で承認します。

1. PRにCodexの👍リアクションがある。
2. 最新のCodex Review SummaryでCode ReviewとSecurity Reviewが両方ともCompletedである。
3. 両レビューの完全SHAが現在のPR HEADと一致する。
4. 同じPR・同じ完全SHAに、`github-actions[bot]` の `APPROVED` または `DISMISSED` 履歴がない。

GitHub APIの `user.login` でCodexを識別し、コメントIDが最も大きいSummaryのMarkdown表から2つの状態欄を読みます。👍と完了状態が揃った後、PR HEADを1回取得し、`codex-review-state:v1` の両レビューの完全な `commit_sha` と照合します。SHA情報の欠落・不正・重複や不一致があれば承認を保留します。確認したSHAを `commit_id` に指定して承認し、応答の対象SHAも確認します。base、時刻、receipt、指摘フラグ、過去の依頼や変更要求は追加条件にしません。

Summaryの作成・編集と `ci-pr` の完了を契機に評価し、CIの成否自体は承認条件にしません。Summaryの更新より👍が遅れる場合に備え、30秒ごとに最大6回再試行します。各試行ではSummaryと👍を各1回読み、両方が揃った場合だけHEADを読みます。送信直前にSummaryや👍を再取得する処理はありません。この待機時間はレビュー完了の証拠ではありません。👍の追加自体は起動イベントではないため、待機終了後は別のSummary更新または `ci-pr` 完了イベントが必要です。PR単位で実行を直列化します。

送信前にこのPRのレビュー履歴を全ページ取得し、同じSHAに対するGitHub Actionsの承認済み・dismiss済み履歴があれば再承認しません。既存レビューに本文マーカーは不要です。同じHEADでCodexを再レビューしても、dismissされた承認は復活させません。別HEAD・別PR・別レビュアーの履歴は抑止対象にならず、履歴取得の失敗時は承認しません。履歴確認とPOSTは別操作であり、ほかの書き込みに対する原子的な予約ではありません。

古い承認の失効、必須チェック、baseとの同期、スレッド解決などのマージ条件はRulesetsが担います。2026-11-01に読み取った [default Ruleset](https://github.com/daiksud/daiksud-me/rules/23758136) は `main` に対して有効で、承認1件、スレッド解決、`dismiss_stale_reviews_on_push: true`、`pass` に対するstrictな必須チェック、`preview` へのDeployment成功を要求していました。実際のマージ判断では有効なルールとbypass権限を再確認してください。この変更では設定を変更しません。

GitHubの[承認失効条件](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-pull-request-reviews-before-merging)は、承認済み差分やmerge baseから導入された変更に関係します。HEADのSHA変更やmainの更新だけで必ず失効するという意味ではありません。[strictな必須チェック](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-status-checks-to-pass-before-merging)によるbase同期も、Codexが特定の差分をレビューした証明ではありません。

このHEADに自動承認履歴がない場合に限り、完了済みの同一HEADのSummaryと既存の👍はbaseが変わっても再利用できます。そのため承認はどの差分がレビューされたかの証明にはならず、マージ可能性とも別です。HEAD確認と承認POSTは別の操作ですが、その間にpushされても指定した `commit_id` は変わりません。現在HEADに対する原子的な保証や、取得後のSummary・👍変更の検知は行いません。workflowは承認を取り消したりマージしたりしません。APIの失敗は実行の失敗として報告し、条件が足りない場合は承認を保留します。

### PRの検証

[PRワークフロー](.github/workflows/ci-pr.yml)は、`draft` → `commit-stage` → `ready` → `acceptance-stage` → `pass` の5つのジョブで進みます。各実行では、最初にPRをDraftに変更する処理を試み、ソースとそれに対応するPreviewを検証した後、PRをReadyに変更してローカルとPreviewの受入テストを実行します。最後の必須ジョブ `pass` は、それまでのステージが成功したかを報告します。追加の検証やPRの状態変更は行いません。PRの作成、更新、再オープン、編集でワークフローが実行されます。

DraftとReadyへの変更には `gh pr ready --undo` と `gh pr ready` を使い、書き込み権限はそれらのジョブだけに付与します。HEADが最新かの確認や、fork・Dependabot専用の例外処理は行いません。状態変更が拒否されると、依存するジョブは実行されず、`pass` は失敗します。commit-stageが失敗した場合、PRはDraftのままです。受入テストが失敗した場合、PRはReadyのままで `pass` が失敗します。失敗したPRを復旧のためにDraftへ戻す処理はありません。

[mainへのpush用ワークフロー](.github/workflows/ci-push.yml)は、PRを操作せず、引き続き `commit-stage` → `acceptance-stage` → `pass` を実行します。両方のワークフローで、[commit-stage](.github/actions/commit-stage/action.yml)と[acceptance-stage](.github/actions/acceptance-stage/action.yml)の複合アクションを再利用します。PRでは、対応するPreview URLを検索できるようcommit-stageにChecksとDeploymentsの読み取り権限を付与し、そのURLをacceptance-stageに渡します。[ライフサイクルのシナリオ](docs/features/pr-validation.feature.md)を参照してください。

Readyになると、現在のソースの検証が成功した状態で、ユーザーまたはコーディングエージェントがAIレビューを明示的に依頼できます。Readyへの変更に伴い、GitHubがCODEOWNERSへ自動的にレビューを依頼する場合があります。ワークフロー自体はAIレビューを依頼しません。Readyはマージの許可を意味しません。必須の `pass`、Previewデプロイ、CodeQL、最新状態のチェック、承認、スレッドの解決は、それぞれ独立した条件として引き続き適用されます。

検証失敗後に状態遷移を最初からやり直す場合は、**Re-run all jobs** を使うか、新しいコミットをpushしてください。失敗したジョブだけの再実行では、ライフサイクル全体はやり直されません。PR単位のconcurrency設定で古い実行をキャンセルしますが、キャンセルとDraft/Readyの変更はアトミックではなく、最終状態を保証できません。独自の実行履歴管理、リトライ、状態検証の仕組みは設けません。候補コードを検証するジョブは読み取り専用とし、認証情報を保持せずにチェックアウトして共通の検証用複合アクションを呼び出します。状態を変更するジョブは、候補コードをチェックアウトせず、`gh` コマンドだけを実行します。

### Cloudflareデプロイの記録

Cloudflare Workers Buildsの `Workers Builds: daiksud-me` Checkが成功すると、[同期ワークフロー](.github/workflows/record-cloudflare-deployment.yml)が、そのCheckのSHAに対してGitHub Deploymentと `success` Statusを記録します。Check Suiteのブランチが `main` なら `production`、それ以外の空でないブランチ名なら `preview` として記録します。実際のデプロイはCloudflare Workers Buildsが行います。

`production` のDeploymentリンクにはカスタムドメインの `https://daiksud.me/` を使い、`preview` のリンクにはブランチごとのWorkers URLを使います。

デプロイの記録処理とPRのPreview照合処理は、[共通のエイリアスヘルパー](scripts/ci/preview-url.mjs)を使い、[Workers SDKのブランチエイリアス規則](https://github.com/cloudflare/workers-sdk/blob/08d694cc8ed69ffe264405a342f1ae0f233d7792/packages/deploy-helpers/src/deploy/helpers/preview-alias.ts)に従います。記号と大文字・小文字を正規化し、長いエイリアスはプロバイダーと同じ方法で元のブランチ名から生成したハッシュを末尾に付けて短縮します。英字から始まる有効なエイリアスを作れないブランチでは、明確なエラーで失敗します。記録処理では、信頼済みのデフォルトブランチ上のワークフローコミットからこのヘルパーだけを読み込みます。依存関係のインストールやPRの候補コードのチェックアウトは行いません。

同期が失敗した場合は、GitHub Actionsの「Record Cloudflare deployment」ワークフローの実行ログを確認し、Check Suiteの取得、Deploymentの作成、Statusの作成のどこで失敗したかを調べます。初期版は成功したCheckだけを記録し、再実行による重複や、途中の失敗で残った不完全なDeploymentを自動修復しません。

`main` に対する `default` Rulesetでは、マージ前に `preview` へのDeploymentが成功していることを要求します。この条件だけを戻す場合は、GitHubの Settings → Rules → Rulesets → `default` にあるRequired deploymentsから `preview` を削除し、ほかのルールはすべて維持してください。
