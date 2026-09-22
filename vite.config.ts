import { defineConfig } from 'vite'

export default defineConfig({ base: './', logLevel: 'warn', build: { assetsInlineLimit: 0 } })
