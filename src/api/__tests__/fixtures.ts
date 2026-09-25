/**
 * Respuesta de Flight Search con ofertas completas, basada en el ejemplo oficial del
 * User Guide (https://developer.sabre.com/rest-api/flightsearch-api/v1) extendido a ida y vuelta.
 */
export const SEARCH_FULL_OFFER_RESPONSE = {
  timestamp: '2026-07-03T12:03:53.372Z',
  flights: [
    { id: '00000000-0000-4000-8000-000000000001', departureAirportCode: 'EZE', departureDate: '2026-11-10', departureTime: '21:40', arrivalAirportCode: 'MAD', arrivalDate: '2026-11-11', arrivalTime: '14:35', operatingAirlineCode: 'UX', operatingFlightNumber: 42, marketingAirlineCode: 'UX', marketingFlightNumber: 42, aircraftTypeCode: '789', durationInMinutes: 775 },
    { id: '00000000-0000-4000-8000-000000000002', departureAirportCode: 'MAD', departureDate: '2026-11-20', departureTime: '23:55', arrivalAirportCode: 'EZE', arrivalDate: '2026-11-21', arrivalTime: '08:40', operatingAirlineCode: 'UX', operatingFlightNumber: 41, marketingAirlineCode: 'UX', marketingFlightNumber: 41, aircraftTypeCode: '789', durationInMinutes: 765 },
    { id: '00000000-0000-4000-8000-000000000003', departureAirportCode: 'EZE', departureDate: '2026-11-12', departureTime: '10:05', arrivalAirportCode: 'GRU', arrivalDate: '2026-11-12', arrivalTime: '12:50', operatingAirlineCode: 'LA', operatingFlightNumber: 8011, marketingAirlineCode: 'LA', marketingFlightNumber: 8011, aircraftTypeCode: '320', durationInMinutes: 165 },
    { id: '00000000-0000-4000-8000-000000000004', departureAirportCode: 'GRU', departureDate: '2026-11-12', departureTime: '16:10', arrivalAirportCode: 'MAD', arrivalDate: '2026-11-13', arrivalTime: '07:30', operatingAirlineCode: 'LA', operatingFlightNumber: 8064, marketingAirlineCode: 'LA', marketingFlightNumber: 8064, aircraftTypeCode: '77W', durationInMinutes: 620 },
    { id: '00000000-0000-4000-8000-000000000005', departureAirportCode: 'MAD', departureDate: '2026-11-22', departureTime: '23:30', arrivalAirportCode: 'EZE', arrivalDate: '2026-11-23', arrivalTime: '08:15', operatingAirlineCode: 'LA', operatingFlightNumber: 8065, marketingAirlineCode: 'LA', marketingFlightNumber: 8065, aircraftTypeCode: '77W', durationInMinutes: 765 },
  ],
  journeys: [
    { id: '00000000-0000-4000-8000-000000000006', flightRefs: ['00000000-0000-4000-8000-000000000001'], requestedJourneyIndex: 0 },
    { id: '00000000-0000-4000-8000-000000000007', flightRefs: ['00000000-0000-4000-8000-000000000002'], requestedJourneyIndex: 1 },
    { id: '00000000-0000-4000-8000-000000000008', flightRefs: ['00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004'], requestedJourneyIndex: 0 },
    { id: '00000000-0000-4000-8000-000000000009', flightRefs: ['00000000-0000-4000-8000-000000000005'], requestedJourneyIndex: 1 },
  ],
  offers: [
    {
      type: 'FlightOffer',
      id: 'o1',
      createdAt: '2026-07-03T12:02:53Z',
      validUntil: '2026-07-03T12:23:53.369Z',
      source: { provider: 'Sabre', distributionModel: 'ATPCO' },
      totalPrice: { amount: '1122.99', currencyCode: 'USD' },
      items: [
        {
          type: 'FlightOfferItem',
          id: 'o1-1-1',
          isMandatory: true,
          isPartial: false,
          fares: [
            {
              travelers: [{ passengerTypeCode: 'ADT', requestedTravelerIndex: 0 }],
              fareTotal: { equivalentFare: '900.18', taxAmount: '222.81', amount: '1122.99', currencyCode: 'USD' },
              validatingAirlineCode: 'UX',
              fareComponents: [
                { amount: '450.09', currencyCode: 'USD', fareBasisCode: 'QLOWAR', segmentDetails: [{ flightRef: '00000000-0000-4000-8000-000000000001', bookingClassCode: 'Q', cabinName: 'Economy' }], brand: { code: 'LITE', name: 'LITE' } },
                { amount: '450.09', currencyCode: 'USD', fareBasisCode: 'QLOWAR', segmentDetails: [{ flightRef: '00000000-0000-4000-8000-000000000002', bookingClassCode: 'Q', cabinName: 'Economy' }], brand: { code: 'LITE', name: 'LITE' } },
              ],
            },
          ],
        },
      ],
      paymentTimeLimit: '2026-07-04T02:02:00Z',
      applicableToPseudoCityCodes: ['AB12'],
      journeyRefs: ['00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000007'],
    },
    {
      type: 'FlightOffer',
      id: 'o2',
      createdAt: '2026-07-03T12:02:53Z',
      validUntil: '2026-07-03T12:23:53.369Z',
      source: { provider: 'Sabre', distributionModel: 'ATPCO' },
      totalPrice: { amount: '980.50', currencyCode: 'USD' },
      items: [
        {
          type: 'FlightOfferItem',
          id: 'o2-1-1',
          isMandatory: true,
          fares: [
            {
              travelers: [{ passengerTypeCode: 'ADT', requestedTravelerIndex: 0 }],
              fareTotal: { equivalentFare: '800.00', taxAmount: '180.50', amount: '980.50', currencyCode: 'USD' },
              validatingAirlineCode: 'LA',
              fareComponents: [
                { amount: '400', currencyCode: 'USD', fareBasisCode: 'SLE0', segmentDetails: [{ flightRef: '00000000-0000-4000-8000-000000000003', bookingClassCode: 'S', cabinName: 'Economy' }, { flightRef: '00000000-0000-4000-8000-000000000004', bookingClassCode: 'S', cabinName: 'Economy' }] },
                { amount: '400', currencyCode: 'USD', fareBasisCode: 'SLE0', segmentDetails: [{ flightRef: '00000000-0000-4000-8000-000000000005', bookingClassCode: 'S', cabinName: 'Economy' }] },
              ],
            },
          ],
        },
      ],
      journeyRefs: ['00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000009'],
    },
  ],
};

/** Respuesta "solo precio" de Search (returnFullOffers: false): journeys sin vuelos. */
export const SEARCH_PRICE_ONLY_RESPONSE = {
  timestamp: '2026-07-03T12:03:53.372Z',
  journeys: [
    { id: '00000000-0000-4000-8000-000000000010', originAirportCode: 'EZE', destinationAirportCode: 'CUN', departureDate: '2026-11-03', requestedJourneyIndex: 0 },
    { id: '00000000-0000-4000-8000-000000000011', originAirportCode: 'CUN', destinationAirportCode: 'EZE', departureDate: '2026-11-10', requestedJourneyIndex: 1 },
    { id: '00000000-0000-4000-8000-000000000012', originAirportCode: 'EZE', destinationAirportCode: 'MIA', departureDate: '2026-11-05', requestedJourneyIndex: 0 },
    { id: '00000000-0000-4000-8000-000000000013', originAirportCode: 'MIA', destinationAirportCode: 'EZE', departureDate: '2026-11-12', requestedJourneyIndex: 1 },
  ],
  offers: [
    { type: 'FlightOffer', id: 'c1', createdAt: '2026-07-03T12:02:53Z', validUntil: '2026-07-03T13:02:53Z', source: { provider: 'Sabre', distributionModel: 'ATPCO' }, totalPrice: { amount: '799', currencyCode: 'USD' }, journeyRefs: ['00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000011'], isNonStop: false },
    { type: 'FlightOffer', id: 'c2', createdAt: '2026-07-03T12:02:53Z', validUntil: '2026-07-03T13:02:53Z', source: { provider: 'Sabre', distributionModel: 'ATPCO' }, totalPrice: { amount: '640', currencyCode: 'USD' }, journeyRefs: ['00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000013'], isNonStop: true },
  ],
};
