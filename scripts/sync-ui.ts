import { mkdir } from 'node:fs/promises'
import { CSS } from '../../dedura-bot/src/ui'

const root = new URL('../', import.meta.url)
await mkdir(new URL('src/vendor/', root), { recursive: true })
await mkdir(new URL('public/', root), { recursive: true })
await Bun.write(new URL('src/vendor/base.css', root), CSS.replace(/[ \t]+$/gm, ''))
for (const name of ['home-clock.css', 'navigation.css', 'desktop.css']) {
  await Bun.write(new URL(`src/vendor/${name}`, root), Bun.file(new URL(`../../dedura-bot/public/${name}`, import.meta.url)))
}
await Bun.write(new URL('public/favicon.ico', root), Bun.file(new URL('../../dedura-bot/public/favicon.ico', import.meta.url)))
console.log('本体の色・書体・botの形・レイアウトをデモ用の独立ファイルへ取り込みました。')
