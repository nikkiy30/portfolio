# SYSTEM_DESIGN.md

## 目的

このドキュメントは、ポートフォリオサイトの現在の構成を後から理解しやすくするための設計メモです。
実装を大きく変える前に、現状のページ構成、処理の流れ、制限を確認できる状態にします。

## 現在の構成

- `index.html`: サイト全体の入口。About / Portfolio / Learning への導線をまとめる。
- `about.html`: 自己紹介、関心分野、学習姿勢、価値観を伝える。
- `portfolio.html`: 制作物の一覧と検索を閲覧者向けに示す。
- `portfolio-admin.html`: ローカル編集用のPortfolio管理画面。Netlify等の公開対象には含めない。
- `data/portfolio-projects.js`: Portfolioページに表示する小規模な静的成果物データ。
- `learning.html`: 公開用のLearningページ。`data/learning-tasks.js` の学習タスクを表示する。
- `learning-admin.html`: ローカル編集用の管理者画面。Netlify等の公開対象には含めない。
- `data/learning-tasks.js`: Learningページに表示する小規模な静的タスクデータ。
- `netlify.toml`: `scripts/build-dist.sh` を呼び出して公開用ファイルだけを `dist/` にコピーしてデプロイする設定。
- `scripts/build-dist.sh`: `*-admin.html` を除く公開HTML、CSS、JS、`data/*.js`、`images/*` を `dist/` に反映するビルドスクリプト。
- `styles.css`: 全ページ共通のレイアウト、色、アニメーションを管理する。
- `script.js`: ナビゲーションの現在地表示、Portfolioページの検索、Learningページのタスク管理を担当する。

現在はフレームワークを使わない静的サイトです。
HTML / CSS / Vanilla JavaScript で構成され、ブラウザで `index.html` を開けば表示できます。

## 処理フロー

### 共通処理

1. 各HTMLの `body` に `data-page` を設定する。
2. `script.js` が `data-nav` を持つリンクを確認する。
3. 現在のページに対応するナビゲーションへ `is-current` を付ける。

### Homeページ

1. `index.html` に About / Portfolio / Learning への導線を配置する。
2. 各導線は直接ページへ遷移し、トップページでは全体像の把握を優先する。

### Portfolioページ

1. `portfolio.html` は公開用ページとして、管理者入力UIを持たない。
2. `data/portfolio-projects.js` が `window.portfolioProjects` に小規模な成果物配列を渡す。
3. 同じブラウザに管理画面の `localStorage` がある場合、`script.js` はそちらを優先して成果物カードを描画する。
4. 成果物に `image.src` と `image.alt` がある場合は、カード上部に写真またはスクリーンショットを表示する。
5. 画像がない成果物は、`previewType` に応じた簡易プレビューを表示する。`site`、`mobile`、`ui`、`notes` を使い分ける。
6. `script.js` が入力された検索語を見て、カードの表示・非表示を切り替える。
7. 該当するカードがない場合は空状態メッセージを表示する。

### Portfolio管理ページ

1. `portfolio-admin.html` はローカル編集用として、公開ナビゲーションからリンクしない。
2. 管理者入力では、作品名、目的、使用技術、次の改善点、検索キーワード、受賞・認定ラベル、関連リンク、写真または画像パス、プレビュー形式を入力する。
3. 入力中の成果物はブラウザの `localStorage` に保存する。
4. 管理者リストでは成果物ごとの編集・削除、または全削除ができる。
5. エクスポート欄に `data/portfolio-projects.js` へ反映するための `window.portfolioProjects = ...` 形式の内容を表示し、`dataファイルを保存` から保存できる。
6. Netlify等では `netlify.toml` のビルド設定により、`portfolio-admin.html` は公開用 `dist/` にコピーしない。
7. 同じブラウザでローカル確認するときは `localStorage` の内容が優先されるが、再配布やデプロイには `data/portfolio-projects.js` を更新したあと、`scripts/build-dist.sh` で写真やリンクを含む公開データを `dist/` にコピーする。

### Learningページ

1. `learning.html` は公開用ページとして、管理者入力UIを持たない。
2. `data/learning-tasks.js` が `window.learningTasks` に小規模なタスク配列を渡す。
3. 同じブラウザに管理画面の `localStorage` がある場合、`script.js` はそちらを優先してタスク数、ステータス別進捗、最新4件のタスク一覧を描画する。
4. 公開ページでは削除ボタンや入力フォームを出さない。

### Learning管理ページ

1. `learning-admin.html` はローカル編集用として、公開ナビゲーションからリンクしない。
2. 管理者入力では、タイトル・状態・メモを入力してタスクを追加する。
3. 入力中のタスクはブラウザの `localStorage` に保存する。
4. 管理者リストではタスクごとの削除、または全削除ができる。
5. エクスポート欄に `data/learning-tasks.js` へ反映するための `window.learningTasks = ...` 形式の内容を表示し、`dataファイルを保存` から保存できる。
6. Netlify等では `netlify.toml` のビルド設定により、`learning-admin.html` は公開用 `dist/` にコピーしない。
7. 同じブラウザでローカル確認するときは `localStorage` の内容が優先されるが、再配布やデプロイには `data/learning-tasks.js` を更新したあと、`scripts/build-dist.sh` で公開データを `dist/` にコピーする。

## API設計

現在、外部APIやバックエンドAPIは使っていません。

- 公開データ: `data/learning-tasks.js`
- Portfolio公開データ: `data/portfolio-projects.js`
- 管理者入力の一時保存: ブラウザの `localStorage`
- 管理者入力の保存キー: `studyfolio-learning-admin-tasks-v1`
- Portfolio管理者入力の保存キー: `studyfolio-portfolio-admin-projects-v1`
- 外部読み込み: Google Fonts
- 共通アイコン: `favicon.png`

`.env` や秘密情報を使う前提の処理はありません。

## 現在の制限

- Learningの公開データ更新は、`data/learning-tasks.js` を編集して再デプロイする運用。
- 管理者入力画面は認証機能ではなく、デプロイ対象から外すことで公開しない設計。
- 静的ホスティングでは、公開対象に含めたHTMLはURL直打ちで見られるため、管理者画面を公開成果物に含めないことが重要。
- Portfolioページの制作物情報はまだ抽象度が高く、詳細な実績説明はこれから整理する。
- テストコードはまだない。
- 現状は静的サイトなので、Flaskなどのバックエンド前提の構成とは分けて考える必要がある。

## 今後の改善方針

- Portfolioページに、制作物ごとの目的、役割、工夫、改善点を追加する。
- READMEを公開向けの入口として整理する。
- `docs/LEARNING_NOTES.md` に、実装から学んだことと再実装ポイントを記録する。
- 必要になった場合だけバックエンドやテスト環境を追加する。
- `.env` が必要な機能を追加する場合も、公開リポジトリには `.env.example` のみ置く。
