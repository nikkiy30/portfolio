# 公開と更新の手順

2026-10-19。Cloudflare Workers Static AssetsとGitHubを使う構成。設定ファイルとローカル検証を用意している。GitHubへの保存からCloudflare接続、継続更新までの手順を記載する。

## 1. ローカルで最終確認

Node.js 24とChromeまたはEdgeを使用する。追加のnpmパッケージは不要。

```powershell
node scripts/release.mjs
node scripts/check-browser.mjs
node scripts/preview.mjs
```

公開プレビューは http://127.0.0.1:4173/ 。終了はCtrl+C。release.mjsはこのリポジトリの生成物distだけを再生成する。ブラウザ検証では外部プレイヤーを遮断し、外部サービスの稼働をCIの成功条件にしない。

## 2. GitHubへ保存してPRを作る

初回公開の作業ブランチはfeat/portfolio-redesign。本番ブランチはmainとする。次のPowerShell例は公開ファイルと必要なソース・設定だけをステージする。手元の試作画像やspotify.htmlをまとめて追加しない。

```powershell
$portfolioPublicFiles = Get-Content -Raw -Encoding UTF8 config/public-files.json | ConvertFrom-Json
git add -- $portfolioPublicFiles
git add -- .gitignore .gitattributes .node-version .github/workflows/site-check.yml config/public-files.json wrangler.json README.md PUBLISHING.md SYSTEM_DESIGN.md scripts/build-dist.sh scripts/site-lib.mjs scripts/release.mjs scripts/preview.mjs scripts/check-browser.mjs script.js portfolio-admin.html
git diff --cached --stat
git commit -m "Prepare portfolio for Cloudflare publication"
git push -u origin HEAD
```

ステージした一覧に自己紹介PDF・docs・work・確認メモがないことを見てからコミットする。

GitHubでfeat/portfolio-redesignからmainへのPull Requestを作る。Portfolio checks内のsite-checkが成功し、表示と差分を確認してからマージする。ワークフローは構文・参照・公開ファイル・画像とリンク・ブラウザ表示・検索・下書き分離・管理画面編集を確認する。GitHub側での初回実行はpush後になる。

GitHubのSettings → Rules → Rulesets、またはBranchesでmainにPRとsite-check成功を必須にする。必要なら管理者の迂回も無効にする。利用プラン等でルールを使えない場合も、mainへ直接pushせずCI成功を確認してからマージする運用を守る。GitHubの保護ルールの適用可否は設定画面で確認する。

## 3. Cloudflareを登録・接続

1. Cloudflareへログイン、未登録ならアカウントを作る。アカウントの多要素認証も設定する。
2. Workers & Pages → Create application → GitHubを選ぶ。
3. GitHubの認可対象はnikkiy30/portfolioだけに絞る。
4. 更新済みmainを選択し、下の設定を入力する。

| 設定 | 値 |
| --- | --- |
| Worker名 | nikkiy-portfolio |
| 本番ブランチ | main |
| ルートディレクトリ | リポジトリ直下（空欄または /） |
| Build command | node scripts/release.mjs |
| Deploy command | npx --yes wrangler@4.151.1 deploy |
| Node.js | 24（.node-versionを同梱。上書きする場合はビルド変数NODE_VERSION=24） |
| 公開するディレクトリ | wrangler.jsonのassets.directory = ./dist |

Wranglerは公式npm配布情報を照会して4.151.1へ固定した。上記Deploy commandはCloudflare内でWranglerを取得・実行する。ローカルへのWranglerインストールは不要。Worker名を変える場合はwrangler.jsonのnameとCloudflare上の名前を両方一致させる。Workersの作成画面ではPages向けの出力ディレクトリ欄を探す必要はなく、公開先は設定ファイルで指定する。

5. Save and Deployを実行する。
6. WorkerのSettings → Build / Builds → Branch controlで、本番がmainになっていることを確認する。初期運用ではEnable Preview Buildsを無効にする。必要になってからPRプレビューの公開範囲を決めて有効化する。
7. 提供されたworkers.devのURLを開く。独自ドメインは初回確認のあとに追加できる。

CloudflareのGit連携はGitHub Actionsの完了を自動で待つ仕組みではない。mainへのマージ条件と、Cloudflare側でもrelease.mjsを再実行する設定の両方を使う。Cloudflare側のビルドコマンドを省略しない。

今回の構成ではGitHub SecretsへのCloudflareトークン登録や、チャットへのパスワード・APIキー送信は不要。Cloudflare画面での通常のGitHub連携を使う。

## 4. 初回公開の確認

- Home、About、Works、Favorites、Contactのリンクが表示される。
- スマホで横にはみ出さず、ChoTechロゴが読み取れる。
- Spotifyが読み込まれ、実端末で再生できる。ローカルCIでは実際の再生を検証していない。
- /developer-admin.html、/portfolio-admin.html、/learning-admin.html、/learning.html、/data/learning-tasks.js、/script.js、/spotify.html、/docs/、/work/が404になる。
- Cloudflareのビルド履歴で公開コミットIDがmainの意図したコミットと一致する。

公開サイトには公開一覧の24ファイルだけを配る。開発者画面を隠す方法はリンク非表示やnoindexではなく、ファイルと管理処理を配布しない方式。GitHubが公開リポジトリの場合、コミット済みの管理画面のソースはGitHubでは閲覧できる。非公開の原本・下書き・確認メモはGitHubへ含めない。

## 5. 公開後も編集する

1. mainから作業ブランチを作る。
2. 作品データはdata/portfolio-projects.js、連絡先はdata/contact-links.jsを編集する。
3. フォームで編集する場合は次を実行し、表示された開発者ツールのURLを開く。

```powershell
node scripts/preview.mjs --developer
```

開発者ツールは http://127.0.0.1:4174/developer-admin.html 。このサーバーは127.0.0.1だけで待ち受ける。作品フォームからデータファイルを保存し、確認してdata/portfolio-projects.jsへ反映する。保存しただけでは公開されない。

下書きはブラウザ内の一時保存でありバックアップではない。以前file://で編集していた下書きは、http://127.0.0.1:4174へ自動移行されない。必要なら旧画面で書き出してから移す。保存キーは互換性のため維持している。

4. 自己紹介・年表は現段階ではindex.htmlとabout.htmlを手動更新する。学習記録からの自動反映やオンラインCMSは未実装。
5. 画像を追加したときはconfig/public-files.jsonにもそのファイルを追加する。自動でフォルダー全体を配布しない。
6. release.mjs → ブラウザ確認 → commit / push → PR → site-check成功 → mainへマージ。Cloudflareが自動で再ビルド・公開する。

main上の編集にはGitHubのWebエディターからでもPRを使う。公開後に問題があればCloudflareのDeployments / Versionsで直前の正常なデプロイへ戻し、その後にコードを修正する。復旧後もGitHubのmainと公開中の版を揃える。

## 検証済みと残る確認

ローカルで24ファイルの配布検査、15画面幅、9通りの文字拡大、11の非公開パスの404、検索、キーボード、管理画面の編集と下書き分離を確認。許可リスト外のファイルをdistへ置くと検査が失敗することも確認した。

GitHub Actionsは各PRの結果とログで確認する。Wranglerによる実デプロイ、Cloudflareでのヘッダーとルーティング、Spotify実再生は公開作業時に確認する。

公式資料: [Git連携の開始](https://developers.cloudflare.com/workers/ci-cd/builds/)、[ビルド設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[ブランチ制御](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)、[Nodeバージョン](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)、[静的ファイルと404](https://developers.cloudflare.com/workers/static-assets/)。