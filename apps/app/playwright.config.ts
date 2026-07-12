import { defineConfig, devices } from '@playwright/test';

/* Tests end-to-end de Sereno. Ils tournent contre le serveur de dev Angular
   (mode invité, IndexedDB) : aucun backend Supabase n'est nécessaire. Chaque
   test démarre dans un contexte vierge, donc IndexedDB et localStorage sont
   remis à zéro entre les scénarios (utile pour rejouer l'onboarding). */
const PORT = 4200;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    cwd: '../..',
  },
});
