import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4181', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    { name: 'chromium-mobile', use: { browserName: 'chromium', channel: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'chromium-desktop', use: { browserName: 'chromium', channel: 'chromium', colorScheme: 'dark', viewport: { width: 1440, height: 1000 } } },
    { name: 'webkit-mobile', use: { browserName: 'webkit', viewport: { width: 390, height: 844 } } },
    { name: 'webkit-desktop', use: { browserName: 'webkit', colorScheme: 'dark', viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: { command: 'bun run preview', url: 'http://127.0.0.1:4181', reuseExistingServer: false },
})
