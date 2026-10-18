# nikkiy's portfolio — Love in My Heart

自己紹介、制作物、活動の軌跡、好きな音楽と風景を紹介する静的ポートフォリオ。
HTML / CSS / Vanilla JavaScriptで構成しています。

## ページとデータ

- Home: 表紙、自己紹介、作品、年表、Favorites
- About: 所属と活動、制作・発表の年表
- Works: 制作物の概要、使用技術、参照先と検索
- 作品データ: data/portfolio-projects.js
- 連絡先: data/contact-links.js
- 公開表示: public.jsとproject-cards.js
- ローカル編集: developer-admin.html、portfolio-admin.html、learning-admin.html、script.js

## ローカル確認

Node.js 24を使用。npmパッケージの追加インストールは不要です。

```powershell
node scripts/release.mjs
node scripts/preview.mjs
```

公開成果物を http://127.0.0.1:4173/ で確認します。終了はCtrl+C。

ChromeまたはEdgeがある環境では次のブラウザ検証も実行できます。

```powershell
node scripts/check-browser.mjs
```

開発者ツールを使うときは次を実行します。

```powershell
node scripts/preview.mjs --developer
```

http://127.0.0.1:4174/developer-admin.html から作品フォームを開けます。フォームの書き出しを公開データファイルへ反映し、PRを通して更新します。Aboutと年表は現在手動更新です。

## 公開

[公開・更新手順](PUBLISHING.md)に、GitHubへ保存するファイル、CI、本番ブランチ、Cloudflareの入力値をまとめています。

公開はconfig/public-files.jsonに明記したファイルだけをdistへコピーします。管理画面・下書き用コード・学習データ・試作HTML・手元の資料は含みません。元のファイルを削除する仕組みではありません。公開用ビルドは生成物distだけを再生成します。

GitHub Actionsで検証し、mainへのマージ後にCloudflare Workers Buildsで再検証してWorkers Static Assetsへ配布する構成です。Cloudflare連携はアカウント側の設定が必要です。

公式ブランド素材の出典はimages/BRAND_ASSETS.txtに記録しています。