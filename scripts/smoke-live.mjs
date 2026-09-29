// Smoke test en vivo contra Sabre (PROD por defecto), SOLO Flight Search y Flight Refresh.
// Usa SABRE_TOKEN de .env.local y le pega directo a Sabre, sin browser ni proxy:
//   Flight Search (explorar) → Flight Refresh (destino más barato, como el botón de la tarjeta)
//   → Flight Search (calendario) → Flight Refresh (varias fechas, un request por fecha)
// Solo imprime estado, latencia, cantidades y el resultado de la validación; nunca el token ni los bodies.
// Uso: npm run smoke:live   (opcional: SMOKE_ORIGIN=MVD npm run smoke:live)

const BASE = process.env.SABRE_BASE_URL || 'https://api.platform.sabre.com';
const ORIGIN = process.env.SMOKE_ORIGIN || 'BUE';
const PCC = process.env.SABRE_REQUEST_PCC || undefined;
const ALLOWED = new Set(['/v1/offers/flightSearch', '/v1/offers/flightRefresh']);

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
let failures = 0;

async function call(label, path, body) {
  if (!ALLOWED.has(path)) throw new Error(`${path} no está en la allowlist (solo Flight Search y Flight Refresh)`);
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
  const ok = res.ok && !(!count && err);
  if (!ok) failures++;
  console.log(
    `${ok ? '✓' : '✗'} ${label} → ${res.status} en ${ms} ms, ${count} resultados` +
      `${err ? ` (${err.type ?? ''}: ${err.description ?? ''}${err.fieldPath ? `, campo ${err.fieldPath}` : ''})` : ''}`,
  );
  if (res.status === 401) {
    console.error('  El token venció o no es válido. Actualizá SABRE_TOKEN en .env.local.');
    process.exit(1);
  }
  return { ok, data };
}

/** Resuelve offers → journeys → flights (modelo Mosaic), con la clase tarifaria de cada vuelo. */
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

/**
 * Request de Flight Refresh como lo arma la app (buildRefreshRequests): los journeys de arriba
 * salen de los vuelos, así cada departureDate coincide con la del primer vuelo del itinerario.
 * Todos los itinerarios del request tienen que compartir ruta y fechas.
 */
function refreshRequest(legsList) {
  const first = legsList[0];
  return {
    journeys: first.map((flights) => ({
      departureLocation: { airportCode: flights[0].departureAirportCode },
      arrivalLocation: { airportCode: flights.at(-1).arrivalAirportCode },
      departureDate: flights[0].departureDate,
    })),
    travelers: [{ passengerTypeCode: 'ADT' }],
    itineraries: legsList.map((legs) => ({ journeys: legs.map((flights) => ({ flights })) })),
    processingOptions: { pseudoCityCode: PCC },
  };
}

function printValidation(data) {
  for (const it of data.itineraries ?? []) {
    console.log(`    itinerario ${it.requestedItineraryIndex}: horario ${it.isItineraryValid ? 'válido' : 'no encontrado'}, clase ${it.bookingClassCodeValidation ?? '—'}`);
  }
}

console.log(`Sabre ${BASE.replace('https://', '')}, origen ${ORIGIN}, PCC ${PCC ?? '(sin configurar)'}\n`);
if (!PCC) console.log('! Flight Refresh exige pseudoCityCode: cargá SABRE_REQUEST_PCC en .env.local. Se corre solo Flight Search.\n');

const from = addDays(today, 20);
const to = addDays(from, 60);
const cities = ['BUE', 'NYC', 'LON', 'PAR', 'SAO', 'RIO', 'TYO', 'CHI', 'MIL', 'ROM'];
const originLocation = { locationType: cities.includes(ORIGIN) ? 'City' : 'Airport', locationCode: ORIGIN };

// 1. Explorar (el mapa): a cualquier lugar, el más barato por destino, con ofertas completas.
const explore = await call('Flight Search (a cualquier lugar, Per Date Range, ofertas completas)', '/v1/offers/flightSearch', {
  departureLocation: originLocation,
  departureDateRange: { fromDate: from, toDate: to },
  lengthsOfStay: [7],
  processingOptions: { publicContentPointOfSaleCountry: 'US', returnMode: 'Per Date Range', returnOffersPerLengthOfStay: false, returnFullOffers: true },
  ...(PCC ? { configuration: { customerCode: PCC } } : {}),
});
const cheapest = [...(explore.data.offers ?? [])]
  .filter((o) => o.items?.length)
  .sort((a, b) => Number(a.totalPrice?.amount) - Number(b.totalPrice?.amount))[0];
if (!cheapest) {
  console.log('\nSin destinos en caché para ese origen; probá con SMOKE_ORIGIN=MIA u otro.');
  process.exit(explore.ok ? 0 : 1);
}
const cheapestLegs = flightsOf(explore.data, cheapest);
const departure = cheapestLegs[0][0].departureAirportCode;
const destination = cheapestLegs[0].at(-1).arrivalAirportCode;
console.log(`  Destino más barato: ${destination} (${cheapest.totalPrice.amount} ${cheapest.totalPrice.currencyCode}), sale ${cheapestLegs[0][0].departureDate}`);

// 2. Refresh del pin más barato: lo mismo que "Validar con Flight Refresh" en la tarjeta.
if (PCC) {
  const single = await call(`Flight Refresh (${departure}-${destination}, 1 itinerario)`, '/v1/offers/flightRefresh', refreshRequest([cheapestLegs]));
  printValidation(single.data);
}

// 3. Calendario: Per Day con ofertas completas para ese par.
const calendar = await call('Flight Search (calendario Per Day, ofertas completas)', '/v1/offers/flightSearch', {
  departureLocation: { locationType: 'Airport', locationCode: departure },
  arrivalLocations: [{ locationFilter: 'Limit To', location: { locationType: 'Airport', locationCode: destination } }],
  departureDateRange: { fromDate: from, toDate: addDays(from, 13) },
  lengthsOfStay: [7],
  processingOptions: { publicContentPointOfSaleCountry: 'US', returnMode: 'Per Day', returnFullOffers: true },
  ...(PCC ? { configuration: { customerCode: PCC } } : {}),
});

// 4. Refresh de varias fechas: un request por ruta y fechas (antes se mandaban juntas y Sabre
//    respondía "Flight and requested journey departure dates must match"). Solo 2 para cuidar el volumen.
if (PCC) {
  const groups = new Map();
  for (const offer of calendar.data.offers ?? []) {
    if (!offer.items?.length) continue;
    const legs = flightsOf(calendar.data, offer);
    const key = legs.map((flights) => `${flights[0].departureAirportCode}-${flights.at(-1).arrivalAirportCode}-${flights[0].departureDate}`).join('|');
    groups.set(key, [...(groups.get(key) ?? []), legs]);
  }
  for (const [key, legsList] of [...groups].slice(0, 2)) {
    const res = await call(`Flight Refresh (${key}, ${legsList.length} itinerario${legsList.length > 1 ? 's' : ''})`, '/v1/offers/flightRefresh', refreshRequest(legsList.slice(0, 100)));
    printValidation(res.data);
  }
}

console.log(`\n${failures ? `✗ ${failures} llamada(s) con error.` : 'Listo.'} No se llamó a ningún endpoint de reserva.`);
process.exit(failures ? 1 : 0);
