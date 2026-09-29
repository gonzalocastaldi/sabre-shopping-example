import { expect, test, type Page } from '@playwright/test';

async function useMock(page: Page) {
  await page.addInitScript(() => localStorage.setItem('galaxy-travel:settings', JSON.stringify({ apiMode: 'mock', pointOfSale: 'US', currency: 'USD', pcc: '' })));
}

test.beforeEach(async ({ page }) => useMock(page));

const map = (page: Page) => page.getByRole('region', { name: 'Mapa de destinos con precios' });
const card = (page: Page) => page.locator('section[aria-labelledby="dest-card-title"]');
/** Pines con etiqueta de precio: el mapa los ubica sin superponerse (los puntos chicos pueden pisarse). */
const pins = (page: Page) => page.locator('[data-map-code]:has(span)');

/** El pin elegido no queda tapado por la tarjeta (en mobile el mapa se corre para mostrarlo). */
async function expectPinVisibleNextToCard(page: Page) {
  await expect
    .poll(async () => {
      const pin = await page.locator('[data-map-code][aria-pressed="true"]').boundingBox();
      const box = await card(page).boundingBox();
      if (!pin || !box) return 'sin pin o sin tarjeta';
      const overlaps = pin.x < box.x + box.width && pin.x + pin.width > box.x && pin.y < box.y + box.height && pin.y + pin.height > box.y;
      return overlaps ? 'la tarjeta tapa el pin' : 'visible';
    })
    .toBe('visible');
}

test('portada: solo la barra de búsqueda y el mapa', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Buscar destinos' })).toBeVisible();
  await expect(map(page)).toBeVisible();
  await expect(page.getByText('Elegí desde dónde salís')).toBeVisible();
  // Sin panel lateral ni pantallas de Shop, Check o Reshop.
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Cambiar un viaje' })).toHaveCount(0);
});

test('recorrido: Flight Search en el mapa → Flight Refresh en la tarjeta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Buscar destinos' }).click();

  // Flight Search: pines con precio sobre el mapa.
  await expect(page.getByText(/\d+ destinos en caché/)).toBeVisible();
  await pins(page).first().click();
  await expect(page).toHaveURL(/sel=[A-Z]{3}/);

  // Tarjeta del destino con la oferta en caché.
  await expect(card(page)).toBeVisible();
  await expect(card(page).getByText('por adulto, tarifa en caché')).toBeVisible();
  await expect(card(page).getByText(/clase [A-Z]/).first()).toBeVisible();
  await expectPinVisibleNextToCard(page);

  // Flight Refresh
  await card(page).getByRole('button', { name: 'Validar con Flight Refresh' }).click();
  await expect(card(page).getByText('Horario publicado (OAG)')).toBeVisible();
  await expect(card(page).getByRole('button', { name: 'Validar de nuevo' })).toBeVisible();

  // Otro destino: la tarjeta cambia sin cerrarse.
  const second = pins(page).nth(1);
  const code = await second.getAttribute('data-map-code');
  await second.click();
  await expect(page).toHaveURL(new RegExp(`sel=${code}`));
  await expect(card(page).getByRole('button', { name: 'Validar con Flight Refresh' })).toBeVisible();

  // API Inspector: solo Flight Search y Flight Refresh.
  await page.getByRole('button', { name: /API Inspector/ }).click();
  const inspector = page.getByRole('dialog', { name: 'API Inspector' });
  await expect(inspector.getByText('Flight Search', { exact: true }).first()).toBeVisible();
  await expect(inspector.getByText('Flight Refresh', { exact: true }).first()).toBeVisible();
  await expect(inspector.getByText(/Flight (Shop|Check|Reshop)/)).toHaveCount(0);
});

test('la tarjeta se maneja con teclado: Enter abre, Escape cierra y el foco vuelve al pin', async ({ page }) => {
  await page.goto('/?o=BUE&dm=theme&dv=Beach');
  const pin = pins(page).first();
  await pin.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dest-card-title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card(page)).toHaveCount(0);
  await expect(pin).toBeFocused();
});

test('el destino elegido queda en la URL (link directo)', async ({ page }) => {
  await page.goto('/?o=BUE&dm=theme&dv=Beach');
  const code = await pins(page).first().getAttribute('data-map-code');
  await page.goto(`/?o=BUE&dm=theme&dv=Beach&sel=${code}`);
  await expect(card(page)).toBeVisible();
  await expect(page.locator(`[data-map-code="${code}"]`)).toHaveAttribute('aria-pressed', 'true');
});

test('de la tarjeta al calendario de tarifas', async ({ page }) => {
  await page.goto('/?o=BUE&dm=theme&dv=Beach');
  await pins(page).first().click();
  await card(page).getByRole('link', { name: /Ver el calendario de tarifas/ }).click();
  await expect(page.getByRole('heading', { name: 'Tarifa más baja por día de salida' })).toBeVisible();
  await page.locator('[data-date]').first().waitFor();
  await expect(page.getByText('volvé al mapa y tocá el destino')).toBeVisible();
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
  await expect(page.getByText(/\d+ orígenes hacia Cancún/)).toBeVisible();
  await page.getByRole('button', { name: /^Lima: desde/ }).click();
  await expect(card(page).getByRole('button', { name: 'Validar con Flight Refresh' })).toBeVisible();
});

test('el mock bloquea todo lo que no sea Search o Refresh, igual que el proxy', async ({ page }) => {
  await page.goto('/');
  const statuses = await page.evaluate(async () =>
    Promise.all(
      ['/api/sabre/v1/offers/flightShop', '/api/sabre/v1/offers/flightCheck', '/api/sabre/v1/offers/flightReshop', '/api/sabre/v1/trip/orders/createBooking'].map(
        async (url) => (await fetch(url, { method: 'POST', body: '{}' })).status,
      ),
    ),
  );
  expect(statuses).toEqual([403, 403, 403, 403]);
});

test('mobile: la tarjeta es una hoja inferior y no tapa el pin elegido @mobile', async ({ page }) => {
  await page.goto('/?o=BUE&dm=theme&dv=Beach');
  await expect(map(page)).toBeVisible();
  await pins(page).first().click();
  await expect(card(page)).toBeVisible();
  await expectPinVisibleNextToCard(page);
  const validate = card(page).getByRole('button', { name: 'Validar con Flight Refresh' });
  await validate.scrollIntoViewIfNeeded();
  await validate.click();
  await expect(card(page).getByText('Horario publicado (OAG)')).toBeVisible();
  // Validar no vuelve a encuadrar el mapa: el pin sigue a la vista.
  await expectPinVisibleNextToCard(page);
});
