---
title: GitHub Actionsにlockfileが登場。サプライチェーン攻撃対策として導入すべき
description: GitHub Actionsのactions.lockの仕組みと、コミットSHA指定との違いを解説します。内部で呼び出されるActionも固定し、サプライチェーン攻撃のリスクを減らせます。
publishedAt: 2026-11-08
tags:
  - github
  - devops
---

2026年10月28日に、GitHub Actionsの「workflow dependency lockfiles (actions.lock)」が一般提供（GA）されました[^1]。この記事では、この `actions.lock` がどういうものなのか、何が嬉しいのかを解説します。

[^1]: Enterprise Cloud（データレジデンシー付きを含む）、Team、Freeの各プランが対象。[GitHub Changelog](https://github.blog/changelog/2026-10-28-github-actions-workflow-lockfiles-are-generally-available/)

## まえがき

少し前までは、Actionを `@v1` のようなメジャーバージョンのタグで指定する書き方が主流でした。しかし2025年3月、23,000以上のリポジトリで利用されていた `tj-actions/changed-files` が侵害され、シークレットが流出しかねないサプライチェーン攻撃が発生しました[^2]。

[^2]: [GitHub Advisory: CVE-2025-30066](https://github.com/advisories/GHSA-mrrh-fwg8-r2c3)

こうした攻撃への対策として、コミットSHAでバージョンを固定する方法が推奨されています。現在ではGitHubの設定でも、コミットSHAによる指定を強制できるようになっています。

![Require actions to be pinned to a full-length commit SHA](/images/github-actions-lockfile-sha-pinning.png)

「Require actions to be pinned to a full-length commit SHA」でフルSHA指定を強制できる

今回登場した `actions.lock` はこのコミットSHA指定の強化版とも言える位置付けです。

## actions.lockとは？

`actions.lock` は、ワークフローが使用するActionと実行対象のコミットを `.github/workflows/actions.lock` に記録する仕組みです。ファイル内には、依存関係や参照元のタグ・ブランチ、コミットSHA、`owner_id`、`repo_id` が保存されます[^3]。

[^3]: [公式フォーマット定義](https://github.com/github/actions-lockfile#schema)

ワークフローの実行時には `actions.lock` に記録されたコミットが使われ、リポジトリの数値ID（`owner_id`・`repo_id`）も照合されます。また、固定したコミットが「記録されたタグやブランチから到達可能であること」も検証されるため、フォーク先にしかないコミットや、履歴の書き換えによって到達できなくなったコミットは実行時に拒否されます[^4]。

[^4]: [GitHub Docs: 仕組みと記録内容](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles)

`actions.lock` の生成にはGitHub公式のCLI拡張を使用します。このファイルは手動で直接編集せず、ワークフローを修正したうえでコマンドから再生成して運用します。

```sh
gh extension install github/gh-actions-lock
gh actions-lock .github/workflows/ci.yml
gh actions-lock --verify .github/workflows/ci.yml
```

> パスを省略して `gh actions-lock` を実行すると、全ワークフローが対象になります。

なお、生成時にワークフロー内の `uses:` がより具体的なバージョンへ書き換わることがあるため、`actions.lock` だけでなく変更差分全体をレビューするとよいでしょう[^5]。

[^5]: [GitHub Docs: 導入手順](https://docs.github.com/en/actions/how-tos/secure-your-work/lock-workflow-dependencies)

## コミットSHA指定と何が違う？

ところで、私は `actions.lock` 登場のニュースを見たとき、率直にこう思いました。

「バージョン固定ならコミットSHA指定でできるじゃん。`actions.lock` の何が嬉しいの？」

しかし詳しく調べてみると、従来のSHA指定との違いが見えてきました。ポイントは、

- どこまで固定できるか
- 情報をどこで管理するか

の2点です。具体的には、以下のような特徴があります。

- **推移的な依存関係も固定できる:** 直接呼び出すActionだけでなく、そのActionが内部で呼び出す別のActionまで固定できる。
- **ワークフローの可読性を保てる:** ワークフローには読みやすいバージョン名（タグ）を残し、SHAの管理を `actions.lock` へ分離できる。
- **リポジトリIDも照合できる:** リポジトリ名とSHAに加え、リポジトリの数値IDも実行時に検証される。

GitHub自身も `actions.lock` 管理下のActionについてはワークフロー内でSHA固定しなくてよいとしています[^6]。

[^6]: ただし対象外の依存関係は別です。[GitHub Docs: SHA固定との比較](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles#how-do-lockfiles-compare-with-sha-pinning)

内部のActionまで固定する重要性を考えるうえで、2026年3月に起きたTrivyの侵害事例が参考になります。このときは `aquasecurity/trivy-action` と、その内部で使われる `aquasecurity/setup-trivy` の多数のタグが悪意あるコミットへ付け替えられました。そのため、内部の `setup-trivy` が固定されていない古いコミットを使っていた場合、利用者は直接依存している `trivy-action` をSHAで固定していても、不正なActionを取得してしまうリスクがあったのです[^7]。

[^7]: [Trivy公式アドバイザリ](https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23)

今回登場した `actions.lock` でネストした依存関係まで固定しておけば、こうしたタグの付け替えによる侵害経路を塞げます。

また、Dependabotもすでに `actions.lock` に対応しており、Actionの更新時には `actions.lock` も自動で更新してくれます（未登録のワークフローは対象外）[^8]。

[^8]: [GitHub Docs: Dependabotと導入の強制](https://docs.github.com/en/actions/how-tos/administer/enforce-workflow-lockfiles)

## まとめ

`actions.lock` の登場により、ワークフローの可読性を保ちつつ利用バージョンを厳密に固定できるようになりました。さらに、従来のSHA指定だけでは防ぎきれなかった「内部で呼び出されるAction」まで含めて、サプライチェーン攻撃のリスクを減らせるのは大きなメリットです。まずは影響の少ないワークフローから小さく試し、更新・検証・レビューの手順を固めながら段階的に取り入れていくとよいでしょう。
