import { expect, test, type Page } from '@playwright/test';

async function useMock(page: Page) {
  await page.addInitScript(() => localStorage.setItem('galaxy-travel:settings', JSON.stringify({ apiMode: 'mock', pointOfSale: 'US', currency: 'USD', pcc: '' })));
}

test.beforeEach(async ({ page }) => useMock(page));

test('recorrido completo: Search → Refresh → Shop → Check', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Playas desde Montevideo' }).click();

  // Flight Search: mapa + lista de destinos
  const list = page.getByRole('complementary', { name: 'Destinos por precio' });
  await expect(list.getByRole('heading', { name: /\d+ destinos/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Mapa de destinos con precios' })).toBeVisible();
  await list.getByRole('link').first().click();

  // Calendario (Per Day) + Refresh
  await expect(page.getByRole('heading', { name: 'Tarifa más baja por día de salida' })).toBeVisible();
  await page.locator('[data-date]').first().waitFor();
  await page.getByRole('button', { name: 'Validar disponibilidad' }).click();
  await expect(page.getByText(/de 10 fechas confirmadas|de \d+ fechas confirmadas/)).toBeVisible();
  await page.locator('[data-date]').nth(3).click();
  await expect(page.getByText('por adulto, en caché')).toBeVisible();

  // Flight Shop
  await page.getByRole('link', { name: 'Ver vuelos en vivo' }).click();
  await expect(page.getByRole('heading', { name: /\d+ de \d+ itinerarios/ })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Ver 3 tarifas/ }).first().click();
  await page.getByRole('button', { name: 'Revisar oferta' }).nth(1).click();

  // Flight Check
  await expect(page.getByRole('heading', { name: 'Revisión de la oferta' })).toBeVisible();
  await expect(page.getByText('Precio revalidado')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Reservar' })).toBeDisabled();

  // API Inspector registra las cuatro APIs
  await page.getByRole('button', { name: /API Inspector/ }).click();
  const inspector = page.getByRole('dialog', { name: 'API Inspector' });
  for (const api of ['Flight Search', 'Flight Refresh', 'Flight Shop', 'Flight Check']) {
    await expect(inspector.getByText(api, { exact: true }).first()).toBeVisible();
  }
});

test('calendario accesible con teclado', async ({ page }) => {
  await page.goto('/destino/MAD?o=BUE&los=10');
  const first = page.locator('[data-date][tabindex="0"]');
  await first.focus();
  const start = await first.getAttribute('data-date');
  await page.keyboard.press('ArrowRight');
  const focused = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.date);
  expect(focused).not.toBe(start);
  await page.keyboard.press('Enter');
  await expect(page.getByText('por adulto, en caché')).toBeVisible();
});

test('open origin: desde dónde es más barato volar', async ({ page }) => {
  await page.goto('/?om=multi&o=EZE,MVD,SCL,LIM&dm=place&dv=CUN');
  await expect(page.getByRole('heading', { name: /orígenes hacia Cancún/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Desde Lima/ })).toBeVisible();
});

test('Flight Reshop devuelve opciones de cambio', async ({ page }) => {
  await page.goto('/cambios');
  await page.getByRole('button', { name: 'Buscar opciones de cambio' }).click();
  await expect(page.getByRole('heading', { name: /\d+ opciones de cambio/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Diferencia de tarifa').first()).toBeVisible();
});

test('el mock bloquea endpoints de reserva igual que el proxy', async ({ page }) => {
  await page.goto('/');
  const status = await page.evaluate(async () => (await fetch('/api/sabre/v1/trip/orders/createBooking', { method: 'POST', body: '{}' })).status);
  expect(status).toBe(403);
});

test('explorar en mobile: mapa y lista @mobile', async ({ page }) => {
  await page.goto('/?o=BUE&dm=theme&dv=Beach');
  await expect(page.getByRole('region', { name: 'Mapa de destinos con precios' })).toBeVisible();
  await page.getByRole('button', { name: 'Lista' }).click();
  await expect(page.getByRole('complementary', { name: 'Destinos por precio' }).getByRole('link').first()).toBeVisible();
});
