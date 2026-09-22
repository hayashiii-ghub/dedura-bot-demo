# dedura-bot-demo

現場仕事の、時間とお金の帳面。[dedura-bot](https://github.com/hayashiii-ghub/dedura-bot)の見た目と操作を、架空のデータで体験するポートフォリオ用デモ。

TypeScript / Viteによる静的サイト。ログイン不要で、処理とデータ保存は閲覧者のブラウザ内で完結する。フォントも同梱する。

## 起動

Node.js 24 / Bun 1.4.2で確認。

```bash
bun install
bun run dev
```

<http://localhost:4180/> を開く。

## 体験できること

- ホームの打刻・カード裏面の金額とカレンダー
- 勤務の追加、経費の入力・写真・確定
- 請求書の作成・発行・入金、帳票の印刷／PDF
- 支払明細の確定・振込状態、月締め・再開
- 売上とサンプルCSV、記録検索
- 名前・外観・botの固定、デモのリセット

日付は2026年9月22日を舞台に固定。出勤は08:00、退勤時刻は入力して試せる。
登場する人・会社・金額はすべて架空で、計算・帳票・CSVは体験用の簡略版。
日本語の画面で、管理者の主要な操作を体験できる。

保存先はlocalStorageの`dedura-bot-demo:v1`。写真は縮小して保存する。
保存が使えない場合はタブ内だけで動作する。頭文字の丸 → アプリ設定 →「デモをリセット」でサンプルに戻せる。

## 静的サイトとして公開

```bash
bun run build
bun run preview
```

プレビューは <http://localhost:4181/>。公開するのは`dist/`の中身。
Cloudflare PagesやGitHub Pagesなど、静的ファイルを配信できる場所に置ける。
ビルドコマンドは`bun run build`、出力ディレクトリは`dist`。環境変数やsecretの登録は不要。
相対アセットURLとハッシュルーティングを使うため、サブディレクトリへの配置にも対応する。
`index.html`のダブルクリックではなく、HTTPサーバーから開く。

## 検証

```bash
bun run typecheck
bun run test
bunx playwright install chromium webkit # 初回。Linuxでは --with-deps も指定
bun run test:browser
```

Chromium・WebKit × スマホ幅／PC幅で、操作・再読み込み・画像保存・月締め・リセット・外部通信なしを確認する。
ブラウザテストはビルド済みの静的サイトを使い、本体のDBや認証情報は使用しない。

## 編集場所

- `src/state.ts`：架空データ・保存形式・集計
- `src/views.ts`：画面
- `src/main.ts`：操作・保存・画面遷移
- `src/card.ts`：カードの裏返し
- `src/style.css`：デモ固有の表示
- `src/vendor/`：本体から取り込んだCSSの独立したコピー

通常の開発・ビルドはこのプロジェクトだけで完結する。
本体のCSSを取り込み直す場合のみ、隣に`dedura-bot`を置いて`bun run sync:ui`を実行する。
