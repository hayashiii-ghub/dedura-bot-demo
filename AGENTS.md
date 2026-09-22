# dedura-bot-demo

出面帳のポートフォリオ用静的デモ。TypeScript / Vite。状態はブラウザのlocalStorage。

- 架空のデータで動かす。本番API・Google認証・D1・R2へ接続しない。
- 色・書体・botの形は`src/vendor/`の既存UIを基準にする。
- 変更に応じて`bun run build`、`bun run test`、`bun run test:browser`を実行する。
- 画面変更時はスマホ・PCの表示と操作を確認する。
