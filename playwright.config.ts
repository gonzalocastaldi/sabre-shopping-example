import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// En Claude Code en la nube Chromium viene preinstalado en /opt/pw-browsers; localmente se
// usa el de Playwright (npx playwright install chromium).
const preinstalled = '/opt/pw-browsers/chromium';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? (existsSync(preinstalled) ? preinstalled : undefined);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: {
    // Siempre en modo mock: los e2e no dependen de la red ni de credenciales.
    command: 'VITE_API_MODE=mock npx vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
