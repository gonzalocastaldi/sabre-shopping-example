// Smoke test en vivo contra Sabre (PROD por defecto), SOLO SHOPPING.
// Usa SABRE_TOKEN de .env.local y le pega directo a Sabre, sin browser ni proxy:
//   Flight Search (explorar) → Flight Search (calendario) → Flight Refresh → Flight Shop → Flight Check
// Solo imprime estado, latencia y cantidades; nunca el token ni los bodies.
// Uso: npm run smoke:live   (opcional: SMOKE_ORIGIN=MVD npm run smoke:live)

const BASE = process.env.SABRE_BASE_URL || 'https://api.platform.sabre.com';
const ORIGIN = process.env.SMOKE_ORIGIN || 'BUE';
const PCC = process.env.SABRE_REQUEST_PCC || undefined;
const ALLOWED = new Set(['/v1/offers/flightSearch', '/v1/offers/flightRefresh', '/v1/offers/flightShop', '/v1/offers/flightCheck']);

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (date, n) => iso(new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000));
const today = iso(new Date());

async function getToken() {
  if (process.env.SABRE_TOKEN) return process.env.SABRE_TOKEN.replace(/^Bearer\s+/i, '').trim();
  const { SABRE_EPR, SABRE_PCC, SABRE_DOMAIN = 'AA', SABRE_PASSWORD } = process.env;
  if (!SABRE_EPR || !SABRE_PCC || !SABRE_PASSWORD) {
    console.error('✗ Falta SABRE_TOKEN en .env.local (o SABRE_EPR/SABRE_PCC/SABRE_PASSWORD para generarlo).');
    process.exit(1);
  }
  const res = await fetch(`${BASE}/v2/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${b64(`${b64(`V1:${SABRE_EPR}:${SABRE_PCC}:${SABRE_DOMAIN}`)}:${b64(SABRE_PASSWORD)}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  console.log(`${res.ok ? '✓' : '✗'} OAuth Token Create v2 → ${res.status}`);
  if (!res.ok) process.exit(1);
  return (await res.json()).access_token;
}

const token = await getToken();

async function call(label, path, body) {
  if (!ALLOWED.has(path)) throw new Error(`${path} no está en la allowlist de shopping`);
  const started = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - started;
  let data = {};
  try {
    data = await res.json();
  } catch {
    // respuesta no JSON
  }
  const err = data.errors?.[0];
  const count = data.offers?.length ?? data.itineraries?.length ?? 0;
  console.log(`${res.ok && !(!count && err) ? '✓' : '✗'} ${label} → ${res.status} en ${ms} ms, ${count} resultados${err ? ` (${err.type ?? ''}: ${err.description ?? ''})` : ''}`);
  if (res.status === 401) {
    console.error('  El token venció o no es válido. Actualizá SABRE_TOKEN en .env.local.');
    process.exit(1);
  }
  return { ok: res.ok, data };
}

/** Resuelve offers → journeys → flights (modelo Mosaic). */
function flightsOf(data, offer) {
  const journeys = new Map((data.journeys ?? []).map((j) => [j.id, j]));
  const flights = new Map((data.flights ?? []).map((f) => [f.id, f]));
  const rbd = new Map();
  for (const item of offer.items ?? []) for (const fc of item.fares?.[0]?.fareComponents ?? []) for (const sd of fc.segmentDetails ?? []) rbd.set(sd.flightRef, sd.bookingClassCode);
  return (offer.journeyRefs ?? []).map((ref) =>
    (journeys.get(ref)?.flightRefs ?? []).map((id) => {
      const f = flights.get(id);
      return {
        departureAirportCode: f.departureAirportCode,
        departureDate: f.departureDate,
        departureTime: f.departureTime,
        arrivalAirportCode: f.arrivalAirportCode,
        arrivalDate: f.arrivalDate,
        arrivalTime: f.arrivalTime,
        marketingAirlineCode: f.marketingAirlineCode,
        marketingFlightNumber: f.marketingFlightNumber,
        ...(rbd.get(id) ? { segmentDetails: { bookingClassCode: rbd.get(id) } } : {}),
      };
    }),
  );
}

console.log(`Sabre ${BASE.replace('https://', '')}, origen ${ORIGIN}\n`);
const from = addDays(today, 20);
const to = addDays(from, 60);
const originLocation = { locationType: ORIGIN.length === 3 && ['BUE', 'NYC', 'LON', 'PAR', 'SAO', 'RIO', 'TYO', 'CHI', 'MIL', 'ROM'].includes(ORIGIN) ? 'City' : 'Airport', locationCode: ORIGIN };

// 1. Explorar: a cualquier lugar, el más barato por destino.
const explore = await call('Flight Search (a cualquier lugar, Per Date Range)', '/v1/offers/flightSearch', {
  departureLocation: originLocation,
  departureDateRange: { fromDate: from, toDate: to },
  lengthsOfStay: [7],
  processingOptions: { publicContentPointOfSaleCountry: 'US', returnMode: 'Per Date Range', returnOffersPerLengthOfStay: false },
  ...(PCC ? { configuration: { customerCode: PCC } } : {}),
});
const journeysById = new Map((explore.data.journeys ?? []).map((j) => [j.id, j]));
const cheapest = [...(explore.data.offers ?? [])].sort((a, b) => Number(a.totalPrice?.amount) - Number(b.totalPrice?.amount))[0];
const firstJourney = cheapest && journeysById.get(cheapest.journeyRefs?.[0]);
const destination = firstJourney?.destinationAirportCode;
if (!destination) {
  console.log('\nSin destinos en caché para ese origen; probá con SMOKE_ORIGIN=MIA u otro.');
  process.exit(explore.ok ? 0 : 1);
}
console.log(`  Destino más barato: ${destination} (${cheapest.totalPrice.amount} ${cheapest.totalPrice.currencyCode})`);

// 2. Calendario: Per Day con ofertas completas para ese par.
const calendar = await call('Flight Search (calendario Per Day, ofertas completas)', '/v1/offers/flightSearch', {
  departureLocation: originLocation,
  arrivalLocations: [{ locationFilter: 'Limit To', location: { locationType: 'Airport', locationCode: destination } }],
  departureDateRange: { fromDate: from, toDate: addDays(from, 13) },
  lengthsOfStay: [7],
  processingOptions: { publicContentPointOfSaleCountry: 'US', returnMode: 'Per Day', returnFullOffers: true },
});
const dayOffers = (calendar.data.offers ?? []).filter((o) => o.items?.length);
if (!dayOffers.length) process.exit(0);

// 3. Refresh: validar hasta 10 fechas en un solo request (misma ruta).
const itineraries = dayOffers.slice(0, 10).map((o) => ({ journeys: flightsOf(calendar.data, o).map((flights) => ({ flights })) }));
const first = itineraries[0].journeys;
await call('Flight Refresh (validación en lote)', '/v1/offers/flightRefresh', {
  journeys: first.map((j) => ({
    departureLocation: { airportCode: j.flights[0].departureAirportCode },
    arrivalLocation: { airportCode: j.flights.at(-1).arrivalAirportCode },
    departureDate: j.flights[0].departureDate,
  })),
  travelers: [{ passengerTypeCode: 'ADT' }],
  itineraries: itineraries.filter((it) => it.journeys[0].flights[0].departureAirportCode === first[0].flights[0].departureAirportCode),
  ...(PCC ? { processingOptions: { pseudoCityCode: PCC } } : {}),
});

// 4. Shop en vivo para la fecha más barata.
const best = [...dayOffers].sort((a, b) => Number(a.totalPrice.amount) - Number(b.totalPrice.amount))[0];
const bestLegs = flightsOf(calendar.data, best);
const dep = bestLegs[0][0].departureDate;
const ret = bestLegs[1]?.[0]?.departureDate;
const shop = await call(`Flight Shop (${bestLegs[0][0].departureAirportCode}-${destination}, ${dep}${ret ? ` / ${ret}` : ''})`, '/v1/offers/flightShop', {
  journeys: [
    { departureLocation: { airportCode: bestLegs[0][0].departureAirportCode }, arrivalLocation: { airportCode: destination }, departureDate: dep },
    ...(ret ? [{ departureLocation: { airportCode: destination }, arrivalLocation: { airportCode: bestLegs[0][0].departureAirportCode }, departureDate: ret }] : []),
  ],
  travelers: [{ passengerTypeCode: 'ADT' }],
  retailing: { returnOfferAttributes: ['Baggage', 'Flexibility'] },
  processingOptions: { limitNumberOfOffers: 20, ...(PCC ? { pseudoCityCode: PCC } : {}) },
});

// 5. Check por payload sobre la tarifa de caché (el camino Search → Check).
await call('Flight Check (payload de la tarifa en caché)', '/v1/offers/flightCheck', {
  journeys: bestLegs.map((flights) => ({ flights })),
  travelers: [{ passengerTypeCode: 'ADT' }],
  retailing: { returnOfferAttributes: ['Baggage', 'Flexibility'] },
  ...(PCC ? { processingOptions: { pseudoCityCode: PCC } } : {}),
});

console.log(`\nListo. Shop devolvió ${shop.data.offers?.length ?? 0} ofertas. No se llamó a ningún endpoint de reserva.`);
