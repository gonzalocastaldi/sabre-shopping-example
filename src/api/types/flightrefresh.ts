// Generado por scripts/gen-types.mjs desde specs/flightrefresh.yml. No editar a mano.

export interface paths {
    "/flightRefresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Supports payload-based batch revalidation of up to 100 itineraries per request.
         * @description The API checks the availability of multiple offers, using itinerary details in the payload as input.
         */
        post: operations["flightRefresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Contains itinerary details and traveler information for batch validation including journeys, travelers, and processing options. */
        FlightRefreshRequest: {
            /** @description Defines traveler trip criteria. */
            journeys: components["schemas"]["Journey"][];
            /** @description Defines list of travelers types for which the system is expected to generate offers. In response, an offer will be associated to passenger from this list, by an array index. */
            travelers: components["schemas"]["Traveler"][];
            /** @description General response options. */
            processingOptions?: components["schemas"]["ProcessingOptions"];
            /** @description Lists itinerary details for batch validation. */
            itineraries: components["schemas"]["Itinerary"][];
        };
        /** @description Contains the requested journey. */
        Journey: {
            /** @description Defines a departure city or airport IATA code. */
            departureLocation: components["schemas"]["Location"];
            /** @description Defines an arrival city or airport IATA code. */
            arrivalLocation: components["schemas"]["Location"];
            /**
             * Format: date
             * @description The departure date in YYYY-MM-DD format in the city or airport time zone.
             * @example 2019-07-09
             */
            departureDate: string;
        };
        /** @description Contains either a city or airport IATA code. */
        Location: components["schemas"]["CityCodeLocation"] | components["schemas"]["AirportCodeLocation"];
        Traveler: {
            /**
             * @description The three-character passenger type code.
             * @example ADT
             */
            passengerTypeCode: string;
        };
        /** @description Contains processing options that enable special features of offer generation. */
        ProcessingOptions: {
            /**
             * @description The unique Point Of Sale identifier (PCC). Applicable to ATPCO.
             * @example PC18
             */
            pseudoCityCode?: string;
            /**
             * @description The configuration identifier to trigger the desired shopping profile and service.
             * @example abc12345
             */
            configurationId?: string;
        };
        /** @description Contains a complete flight itinerary with journey details for validation. */
        Itinerary: {
            /** @description Lists journey details for this itinerary to be validated including flight segments. */
            journeys: components["schemas"]["ItineraryJourney"][];
        };
        /** @description Contains the response with itineraries validation by the API. */
        FlightRefreshResponse: {
            /**
             * Format: date-time
             * @description Provides the server timestamp.
             * @example 2019-09-09T09:09:09Z
             */
            timestamp: string;
            /** @description Lists detailed error information. For a successful response, this element won't exist in the response. */
            errors?: components["schemas"]["Error"][];
            /** @description Lists validated itineraries and their status. */
            itineraries?: components["schemas"]["ItineraryValidationResults"][];
        };
        /**
         * @description Identifies the booking class validation status. Can be Matched, Any other, None, Same cabin or Unknown.
         * @default Unknown
         * @example Matched
         * @enum {string}
         */
        BookingClassCodeValidationEnum: "Matched" | "Same cabin" | "Any other" | "None" | "Unknown";
        /** @description Contains the number of available seats associated with booking class code. */
        SeatsPerBookingClassCode: {
            /**
             * @description The code assigned to the booking class; this is sometimes referred to as the reservation booking designator, RBD.
             * @example E
             */
            bookingClassCode: string;
            /**
             * Format: int32
             * @description The number of available seats per booking class code.
             * @example 1
             */
            seatsAvailable: number;
        };
        /** @description Contains flight availability information. */
        FlightAvailabilityInformation: {
            /** @description Defines the cabin name associated with the specified segment of the journey the fare was calculated for. */
            cabinName: components["schemas"]["CabinNameResponseEnum"];
            /** @description Lists the available booking class code with the number of available seats for it. */
            bookingClassCodes: components["schemas"]["SeatsPerBookingClassCode"][];
        };
        /** @description Contains data for returned flights within journey. */
        JourneyAvailabilityInformation: {
            /** @description Lists detailed availability information per flight. */
            flights: components["schemas"]["FlightAvailabilityInformation"][];
        };
        /** @description Contains additional information about available cabins for requested itinerary. */
        CabinAvailability: {
            /** @description Lists available journeys. */
            journeys: components["schemas"]["JourneyAvailabilityInformation"][];
        };
        /** @description Contains information about the refreshed itinerary. It is still valid if it matches the request booking class. */
        ItineraryValidationResults: {
            /**
             * Format: int32
             * @description Reference ID to the itinerary provided in the request.
             * @example 1
             */
            requestedItineraryIndex: number;
            /**
             * @description If true, the flight schedule was validated against OAG (Flight Database & Statistics | Aviation Analytics) filed inventory.
             * @example true
             */
            isItineraryValid: boolean;
            /** @description Contains the booking class validation status. */
            bookingClassCodeValidation?: components["schemas"]["BookingClassCodeValidationEnum"];
            /** @description Contains additional information about available cabins for requested itinerary. */
            cabinAvailability?: components["schemas"]["CabinAvailability"];
        };
        /** @description Contains a city IATA code. */
        CityCodeLocation: {
            /**
             * @description City IATA code.
             * @example NYC
             */
            cityCode?: string;
        };
        /** @description Contains an airport IATA code. */
        AirportCodeLocation: {
            /**
             * @description Airport IATA code.
             * @example DFW
             */
            airportCode?: string;
        };
        /** @description Contains fare-related details for a specific flight segment. */
        Segment: {
            /**
             * @description The Reservation Booking Designator (booking code) applicable to the journey segment for which the fare was calculated.
             * @example E
             */
            bookingClassCode: string;
        };
        /** @description Contains details of a single flight segment including departure, arrival, and carrier information. */
        ItineraryFlight: {
            /**
             * @description The three-letter IATA code of the departure airport.
             * @example DFW
             */
            departureAirportCode: string;
            /**
             * Format: date
             * @description The departure date in the airport time zone.
             * @example 2024-01-26
             */
            departureDate: string;
            /**
             * @description The departure time in the airport time zone.
             * @example 17:55
             */
            departureTime: string;
            /**
             * @description The three-letter IATA code of the arrival airport.
             * @example FRA
             */
            arrivalAirportCode: string;
            /**
             * Format: date
             * @description The arrival date in the airport time zone.
             * @example 2024-01-26
             */
            arrivalDate: string;
            /**
             * @description The arrival time in the airport time zone.
             * @example 15:00
             */
            arrivalTime: string;
            /**
             * @description The IATA code of the marketing carrier.
             * @example AA
             */
            marketingAirlineCode: string;
            /**
             * Format: int32
             * @description The marketing carrier flight number.
             * @example 1001
             */
            marketingFlightNumber: number;
            /** @description Fare-related details for a specific flight segment. */
            segmentDetails?: components["schemas"]["Segment"];
        };
        /** @description Contains a journey. */
        ItineraryJourney: {
            /** @description Lists flights within the journey. */
            flights: components["schemas"]["ItineraryFlight"][];
        };
        Error: {
            /**
             * @description A high-level grouping of errors indicating what kind of (client-side or server-side) problem occurred.
             * @example BAD_REQUEST
             */
            category: string;
            /**
             * @description An application-specific error type, or one from the list of typical Sabre API errors.
             * @example REQUIRED_FIELD_MISSING
             */
            type: string;
            /**
             * @description A human-readable description of what went wrong with enough information that a software developer can use to debug the problem.
             * @example Client did not provide required data. See fieldName for the item expected in the request.
             */
            description?: string;
            /**
             * @description Additional information to help debug the error. For example, the name of the parameter missing from a request payload.
             * @example currencyCode
             */
            fieldName?: string;
            /**
             * @description Additional information to help debug the error. For example, the name of the parameter missing from a request payload.
             * @example currencyCode
             */
            fieldPath?: string;
            /**
             * @description The source of the error.
             * @example field value
             */
            fieldValue?: string;
        };
        /**
         * @description Identifies the cabin for which the API generated offers.
         * @default Unknown
         * @example Economy
         * @enum {string}
         */
        CabinNameResponseEnum: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy" | "Unknown";
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    flightRefresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Check the availability of multiple flight itineraries using Sabre inventory. Validation includes schedule and availability checks only. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["FlightRefreshRequest"];
            };
        };
        responses: {
            /** @description Successful response unless `errors` element is returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FlightRefreshResponse"];
                };
            };
        };
    };
}
