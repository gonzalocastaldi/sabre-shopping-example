// Generado por scripts/gen-types.mjs desde specs/flightsearch.yml. No editar a mano.

export interface paths {
    "/flightSearch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Returns list of Flight Offers from multiple sources.
         * @description Creates a comprehensive flight search across multiple sources for flexible origins, destinations, or dates, utilizing data from both the Sabre Cache and the Offer repository.
         */
        post: operations["flightsearch"];
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
        FlightSearchRequest: {
            /** @description When set to country, or one of list types, indicates open origin type of request. When set to Airport/City indicates open destination type of request. Other location types aren't allowed. */
            departureLocation: components["schemas"]["Location"];
            /** @description When omitted, indicates 'to anywhere'. Must be set to either Airport or City in open origin type of request. All location types allowed in open destination type of request. */
            arrivalLocations?: components["schemas"]["ArrivalLocationFilters"];
            /** @description Contains the range of departure dates for the outbound flight, including the earliest (fromDate) and latest (toDate) allowed dates, both in YYYY-MM-DD format and based on the origin airport's local time zone. */
            departureDateRange?: components["schemas"]["DepartureDateRange"];
            /** @description Defines the number of days that passes between outbound and inbound flights in a round-trip journey. Order of items may be relevant for some diversity algorithms. */
            lengthsOfStay?: components["schemas"]["LengthsOfStay"];
            /** @description Defines additional search modifiers and filters. */
            processingOptions?: components["schemas"]["ProcessingOptions"];
            /** @description List of providers and distribution models to be filtered from final response. */
            sources?: components["schemas"]["SourcesFilter"];
            /** @description Defines additional customer-related information that influences processing. */
            configuration?: components["schemas"]["Configuration"];
        };
        /** @description Contains budget information to filter by in the final response. */
        Budget: {
            /**
             * Format: int32
             * @description The threshold above which offers are excluded. Excludes any offer above this total fare.
             * @example 500
             */
            maximumTotalFareAmount: number;
            /** @description The three-letter ISO-4217 currency code associated with amounts. */
            currencyCode: components["schemas"]["CurrencyCode"];
        };
        /** @description Contains processing options that enable special features of offer generation. */
        ProcessingOptions: {
            /** @description When set, triggers public cache content created by Sabre PCCs as addition to private content eligible for the requesting PCC. Depending on the country chosen offers may be different and may be presented in different currency. */
            publicContentPointOfSaleCountry?: components["schemas"]["CountryCode"];
            /**
             * @description If `true`, allows the system to support two price points—based on a specific date, origin (city), and destination, one for 'LowestFare' and one for 'LowestNonStopFare'.
             * @default false
             */
            returnLowestNonStopFare: boolean;
            /** @description Defines grouping of results by time ranges. Support 3 Modes lowest per date range month (map mode), lowest per every single day, and lowest per date range. */
            returnMode?: components["schemas"]["ReturnModeEnum"];
            /**
             * @description If `true`, returns full offer details instead of only the total price.
             * @default false
             */
            returnFullOffers: boolean;
            /**
             * @description If `true`, returns separate offers for each requested length of stay. If false, it selects only the cheapest offer across all lengths of stay.
             * @default true
             */
            returnOffersPerLengthOfStay: boolean;
            /**
             * @description If `true`, returns one virtual interline solution in addition to the full journey solutions.
             * @default false
             */
            returnVirtualInterlines: boolean;
            /** @description The Price range where returned offers must fall into. */
            budget?: components["schemas"]["Budget"];
        };
        /**
         * @description Lists the trip duration in days. When provided, the API treats the request as a round-trip. The return date is calculated based on the final day of the stay. If a departure date is not specified, the itinerary defaults to a sequence of consecutive days starting from the current date.
         * @example [
         *       1,
         *       3,
         *       5
         *     ]
         */
        LengthsOfStay: number[];
        /** @description Contains the departure flight date in the origin airport's time zone. If omitted, the system defaults to a search range between 'today' and 330 days from 'today', with both boundaries calculated in UTC. */
        DepartureDateRange: {
            /** @description Contains the scheduled departure date in `YYYY-MM-DD` format, based on the airport's local time zone. */
            fromDate: components["schemas"]["LocalDate"];
            /** @description Contains the scheduled departure date in `YYYY-MM-DD` format. If not provided, assume maximum supported (330 days from "now"). */
            toDate?: components["schemas"]["LocalDate"];
        };
        /** @description Defines a location together with an information if it's to be included or excluded from the result set. */
        ArrivalLocationFilters: components["schemas"]["LocationFilter"][];
        /** @description Contains a location definition paired with an information indicating whether it should be included in or excluded from the results. */
        LocationFilter: {
            /** @description Allow capability to include or exclude locations from the result set. Possible values: Exclude or Limit To. */
            locationFilter: components["schemas"]["FilterTypeEnum"];
            /** @description Defines location to be filtered. */
            location: components["schemas"]["Location"];
        };
        Location: {
            /** @description Contains the specific category or type of location. */
            locationType: components["schemas"]["LocationTypeEnum"];
        };
        /**
         * @description The location type.
         * @example Airport
         * @enum {string}
         */
        LocationTypeEnum: "Airport" | "AirportList" | "City" | "CityList" | "Country" | "CountryList" | "Region" | "Theme";
        CountryList: Omit<components["schemas"]["Location"], "locationType"> & {
            /** @description Lists the countries included. */
            locationCodes: components["schemas"]["CountryCode"][];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "CountryList";
        };
        /** @description Contains country and location information to filter by in the final response. */
        Country: Omit<components["schemas"]["Location"], "locationType"> & {
            /** @description Defined 'Country' code location type. */
            locationCode: components["schemas"]["CountryCode"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "Country";
        };
        /** @description Contains airport list and location information to filter by in the final response. */
        AirportList: Omit<components["schemas"]["Location"], "locationType"> & {
            /** @description Lists the airport codes included. */
            locationCodes: components["schemas"]["AirportCode"][];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "AirportList";
        };
        /** @description Contains airport and location information to filter by in the final response. */
        Airport: Omit<components["schemas"]["Location"], "locationType"> & {
            /** @description Defined 'Airport' code location type. */
            locationCode: components["schemas"]["AirportCode"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "Airport";
        };
        /** @description Contains City list and location information to filter by in the final response. */
        CityList: Omit<components["schemas"]["Location"], "locationType"> & {
            /** @description Lists the city codes included. */
            locationCodes: components["schemas"]["CityCode"][];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "CityList";
        };
        /** @description Contains city and location information to filter by in the final response. */
        City: {
            /** @description The code of the city area. */
            locationCode: components["schemas"]["CityCode"];
        } & (Omit<components["schemas"]["Location"], "locationType"> & Record<string, never> & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "City";
        });
        /** @description Contains region and location information to filter by in the final response. */
        Region: {
            /** @description The code of the region area. */
            locationCode: components["schemas"]["RegionEnum"];
        } & (Omit<components["schemas"]["Location"], "locationType"> & Record<string, never> & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "Region";
        });
        /** @description Contains theme and location information to filter by in the final response. */
        Theme: {
            /** @description Definition of pre defined "Theme" types. */
            locationCode: components["schemas"]["ThemeEnum"];
        } & (Omit<components["schemas"]["Location"], "locationType"> & Record<string, never> & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            locationType: "Theme";
        });
        /**
         * @description Identifies lists of Zone Codes, according to the ATPCO automated rules and footnotes subscription service, APPENDIX C.
         * @enum {string}
         */
        RegionEnum: "0-North America" | "2-Canada" | "9-Mexico" | "120-Greenland and Saint Pierre and Miquelon" | "140-Caribbean area" | "160-Central America" | "170-South America" | "171-South America and South Atlantic" | "172-Bolivarian countries" | "210-Europe" | "211-Iberian Peninsula" | "212-Scandinavia" | "220-Middle East" | "230-Africa" | "231-West Africa" | "232-Southern Africa" | "233-East Africa" | "310-Japan and Koreas" | "320-Southeast Asia" | "330-Southeast Asian subcontinent" | "340-Southwest Pacific" | "350-US Pacific trust territories" | "360-Russian Federation East of Urals" | "370-Micronesia";
        /**
         * @description Identifies theme definitions. Each item resolves to a list of airport codes mapped to a given theme.
         * @enum {string}
         */
        ThemeEnum: "Beach" | "Caribbean" | "Disney" | "Gambling" | "Historic" | "Mountains" | "National Parks" | "Outdoors" | "Romantic" | "Shopping" | "Skiing" | "Theme Park";
        /**
         * @description ReturnModes: * 'Per Day' - Returns the cheapest offer (one option), per origin-destination, for each day, in a given search date range. * 'Per Month' - Return the cheapest offer (one option), per origin-destination, per month, in the given search date range. * 'Per Date Range' - Return the cheapest (one option) offer, per origin-destination, for the whole length of stay (in the given search date range). It's one offer for OneWays, but multiple offers for Round Trips.
         * @default Per Day
         * @enum {string}
         */
        ReturnModeEnum: "Per Day" | "Per Month" | "Per Date Range";
        Configuration: {
            /** @description Contains the Pseudo City Code (PCC), which triggers processing to return options applicable to the specified PCC. If omitted, options for all PCCs are returned. If provided, it acts as a filter. */
            customerCode?: components["schemas"]["PseudoCityCode"];
        };
        FlightSearchResponse: {
            /** @description Contains the server timestamp. */
            timestamp: components["schemas"]["DateTimeWithZone"];
            /** @description Lists the flights. */
            flights?: components["schemas"]["Flight"][];
            /** @description Lists the journeys. */
            journeys?: components["schemas"]["Journey"][];
            /** @description Lists the offers. */
            offers?: components["schemas"]["BaseOffer"][];
            /** @description Lists detailed error information. For a successful response, this element won't exist in the response. */
            errors?: components["schemas"]["Error"][];
        };
        /**
         * @description The filter type definition, which specifies whether to limit the search to provided values or exclude them from the results.
         * @default Limit To
         * @enum {string}
         */
        FilterTypeEnum: "Exclude" | "Limit To";
        /**
         * @description The data source provider (e.g., Sabre) from which the requested offers are retrieved.
         * @example Sabre
         * @enum {string}
         */
        ProviderTypeEnum: "Sabre" | "Direct" | "Third Party";
        /**
         * @description The distribution model or the specific systems and companies hosting carrier APIs from which offers are retrieved.
         * @example ATPCO
         * @enum {string}
         */
        DistributionModelTypeEnum: "ATPCO" | "API" | "NDC";
        /** @description Contains providers and distribution models to filter from or to include in the final response. */
        SourcesFilter: {
            /** @description Lists the sources restricted to the specified providers. */
            providers?: components["schemas"]["ProviderTypeEnum"][];
            /** @description Lists the sources restricted to the specified distribution models. */
            distributionModels?: components["schemas"]["DistributionModelTypeEnum"][];
        } | {
            /** @description Lists the excluded providers. */
            excludeProviders?: components["schemas"]["ProviderTypeEnum"][];
            /** @description Lists the excluded distribution models. */
            excludeDistributionModels?: components["schemas"]["DistributionModelTypeEnum"][];
        };
        /**
         * Format: number
         * @description The monetary amount of fares, taxes, fees, surcharges in associated currency.
         * @example 128.00
         */
        Amount: string;
        /** @description Contains the total price of all the offer's items. */
        TotalPrice: {
            /** @description The total amount. */
            amount: components["schemas"]["Amount"];
            /** @description The three-letter ISO-4217 currency code associated with amounts. */
            currencyCode: components["schemas"]["CurrencyCode"];
        };
        /**
         * @description The two-letter code of a country defined under ISO 3166.
         * @example US
         */
        CountryCode: string;
        /**
         * @description The three-letter IATA code of the airport.
         * @example JFK
         */
        AirportCode: string;
        /**
         * @description The three-letter code of a city defined by IATA Metropolitan areas codes.
         * @example NYC
         */
        CityCode: string;
        /**
         * @description The IATA code of an operating carrier.
         * @example AA
         */
        CarrierCode: string;
        /**
         * Format: date-time
         * @description The ISO date time with zone designator.
         * @example 2024-03-20T11:11:21.125Z
         */
        DateTimeWithZone: string;
        /**
         * Format: date
         * @description The ISO simple date.
         * @example 2024-03-20
         */
        LocalDate: string;
        /**
         * @description The IATA code of the aircraft.
         * @example 346
         */
        AircraftCode: string;
        /**
         * @description The three-letter ISO-4217 currency code associated with amounts.
         * @example USD
         */
        CurrencyCode: string;
        /**
         * @description The PCC code.
         * @example KF8C
         */
        PseudoCityCode: string;
        /**
         * @description The cabin name used to filter and generate the corresponding flight offers.
         * @default Unknown
         * @example Economy
         * @enum {string}
         */
        CabinNameResponseEnum: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy" | "Unknown";
        /**
         * @description The data source provider, such as Sabre, from which the offers are retrieved.
         * @default Unknown
         * @example Sabre
         * @enum {string}
         */
        ProviderTypeResponseEnum: "Sabre" | "Direct" | "Third Party" | "Unknown";
        /**
         * @description The distribution model or the systems and companies hosting carrier APIs from which offers are retrieved. carrier APIs from which offers are expected.
         * @default Unknown
         * @example ATPCO
         * @enum {string}
         */
        DistributionModelTypeResponseEnum: "ATPCO" | "API" | "NDC" | "Mixed" | "Unknown";
        Source: {
            /** @description Contains the data provider. */
            provider?: components["schemas"]["ProviderTypeResponseEnum"];
            /**
             * @description The data supplier identifier.
             * @example Supplier identifier
             */
            supplier?: string;
            /** @description The data distribution model. */
            distributionModel?: components["schemas"]["DistributionModelTypeResponseEnum"];
        };
        /** @description The hidden stop details in order of their appearance. Returned for flight where stops are applicable. */
        HiddenStop: {
            /** @description Contains the stopover point in the three-letter IATA airport code format. */
            airportCode: components["schemas"]["AirportCode"];
            /** @description The arrival date in the airport time zone. */
            arrivalDate?: components["schemas"]["LocalDate"];
            /**
             * @description The arrival time in the airport time zone.
             * @example 15:00
             */
            arrivalTime?: string;
            /** @description The departure date in the airport time zone. */
            departureDate?: components["schemas"]["LocalDate"];
            /**
             * @description The departure time in the airport time zone.
             * @example 17:55
             */
            departureTime?: string;
            /**
             * Format: int32
             * @description The Stop duration in minutes.
             * @example 90
             */
            durationInMinutes?: number;
            /**
             * @description If `true`, requires a change of aircraft.
             * @default false
             */
            hasChangeOfGauge: boolean;
            /** @description The IATA code of the aircraft type. */
            aircraftTypeCode?: components["schemas"]["AircraftCode"];
        };
        /** @description Contains a portion of travel. A round trip consists of two journeys (for example, outbound and inbound). */
        Journey: {
            /**
             * Format: uuid
             * @description The unique ID of the journey.
             * @example ccc04ff0-d5ce-4314-9cbc-f01ec6bb91ab
             */
            id?: string;
            /**
             * Format: int32
             * @description The zero-based index of the journey from the request.
             * @example 0
             */
            requestedJourneyIndex?: number;
        } & ({
            /** @description Contains the departure airport of the first flight within the journey. */
            originAirportCode?: components["schemas"]["AirportCode"];
            /** @description The arrival airport of the last flight within the journey. */
            destinationAirportCode?: components["schemas"]["AirportCode"];
            /** @description The departure date of the first flight within the journey. */
            departureDate?: components["schemas"]["LocalDate"];
        } | {
            /** @description Lists the flight references for the given journey. */
            flightRefs?: string[];
        });
        Flight: {
            /**
             * Format: uuid
             * @description The unique ID of the flight.
             * @example bf74c8ee-393a-45c8-8f15-a27fa6395050
             */
            id?: string;
            /** @description The three-latter IATA code of the departure airport. */
            departureAirportCode?: components["schemas"]["AirportCode"];
            /** @description The departure date in the airport time zone. */
            departureDate?: components["schemas"]["LocalDate"];
            /**
             * @description The departure time in the airport time zone.
             * @example 17:55
             */
            departureTime?: string;
            /** @description The three-latter IATA code of the arrival airport. */
            arrivalAirportCode?: components["schemas"]["AirportCode"];
            /** @description The arrival date in the airport time zone. */
            arrivalDate?: components["schemas"]["LocalDate"];
            /**
             * @description The arrival time in the airport time zone.
             * @example 15:00
             */
            arrivalTime?: string;
            /** @description The IATA code of an operating carrier. */
            operatingAirlineCode?: components["schemas"]["CarrierCode"];
            /**
             * Format: int32
             * @description An operating carrier flight number.
             * @example 1001
             */
            operatingFlightNumber?: number;
            /** @description The IATA code of a marketing carrier. */
            marketingAirlineCode?: components["schemas"]["CarrierCode"];
            /**
             * Format: int32
             * @description A marketing carrier flight number.
             * @example 1001
             */
            marketingFlightNumber?: number;
            /** @description The disclosure carrier code or name. */
            disclosureAirlineCode?: components["schemas"]["CarrierCode"];
            /** @description The IATA code of the aircraft type. */
            aircraftTypeCode?: components["schemas"]["AircraftCode"];
            /**
             * Format: int32
             * @description The flight duration in minutes.
             * @example 90
             */
            durationInMinutes?: number;
            /** @description Lists the stop details when a flight includes hidden stops. */
            hiddenStops?: components["schemas"]["HiddenStop"][];
        };
        /** @description The total price amount, including taxes and surcharges. */
        Fares: {
            /** @description Contains the net fare amount. */
            equivalentFare?: components["schemas"]["Amount"];
            /** @description Contains the total tax amount. */
            taxAmount?: components["schemas"]["Amount"];
            /** @description The total amount, including air fare, taxes, and surcharges. */
            amount?: components["schemas"]["Amount"];
            /** @description The three-letter ISO-4217 currency code associated with amounts. */
            currencyCode?: components["schemas"]["CurrencyCode"];
        };
        /** @description Contains the details of the fare component, which are associated with a specific segment of the journey. a specific segment of the journey. */
        FareComponentSegmentDetail: {
            /**
             * Format: uuid
             * @description The ID of the flight.
             * @example bf74c8ee-393a-45c8-8f15-a27fa6395050
             */
            flightRef: string;
            /**
             * @description The Reservation Booking Designator (booking code) applicable for specific segment of the journey the fare was calculated for.
             * @example M
             */
            bookingClassCode?: string;
            /** @description The cabin code associated with the specified segment of the journey the fare was calculated for. */
            cabinName?: components["schemas"]["CabinNameResponseEnum"];
        };
        /** @description Contains the brand details associated with the fare component. */
        FareBrand: {
            /**
             * @description The brand code.
             * @example BASICECON
             */
            code?: string;
            /**
             * @description The brand name.
             * @example BASIC ECONOMY
             */
            name?: string;
            /**
             * Format: int32
             * @description The brand program identifier.
             * @example 372463
             */
            programId?: number;
        };
        /** @description Contains the fare components used to calculate the total price for a specific itinerary. */
        FareComponent: {
            /** @description Contains the net fare component amount. */
            amount?: components["schemas"]["Amount"];
            /** @description The three-letter ISO-4217 currency code associated with the amount. */
            currencyCode?: components["schemas"]["CurrencyCode"];
            /** @description The published net fare component amount. */
            publishedAmount?: components["schemas"]["Amount"];
            /** @description The three-letter ISO-4217 currency code associated with the publishedAmount. */
            publishedCurrencyCode?: components["schemas"]["CurrencyCode"];
            /**
             * Format: number
             * @description The exchange rate used to convert the construction fare amount published in neutral unit of currency (NUC) to published fare amount in a local currency of trip origin.
             * @example 1.00000
             */
            exchangeRate?: string;
            /**
             * @description The Fare Basis associated with the fare component.
             * @example W7C1V2
             */
            fareBasisCode?: string;
            /**
             * @description The account code associated with the fare component.
             * @example ACC33
             */
            accountCode?: string;
            /** @description Lists the segment details. */
            segmentDetails?: components["schemas"]["FareComponentSegmentDetail"][];
            /** @description Defines the brand associated with the fare component. */
            brand?: components["schemas"]["FareBrand"];
        };
        /**
         * @description The private fare type.
         * @example Has Program Code
         * @enum {string}
         */
        PrivateFareIndicatorEnum: "Has Program Code" | "Ineligible For Ticketing" | "Any";
        /** @description Contains the traveler type for which the fare was generated, paired with the corresponding passenger index from the request. with index of passenger from the request. */
        ReturnedTraveler: {
            /**
             * @description The passenger ID used to generate the offer.
             * @example Passenger1
             */
            id?: string;
            /**
             * @description The passenger type used to generate the offer.
             * @example ADT
             */
            passengerTypeCode: string;
        };
        /** @description Contains the list of fare-related details. */
        FareDetail: {
            /** @description Lists the group of travelers associated with the fare. */
            travelers: components["schemas"]["ReturnedTraveler"][];
            /** @description The total fare amount, including taxes and surcharges. */
            fareTotal: components["schemas"]["Fares"];
            /** @description The type of private fare used. */
            privateFare?: components["schemas"]["PrivateFareIndicatorEnum"];
            /** @description The validating carrier IATA code. */
            validatingAirlineCode?: components["schemas"]["CarrierCode"];
            /** @description Lists the fare components used to compute the fare. */
            fareComponents: components["schemas"]["FareComponent"][];
        };
        /** @description Contains a purchasable flight travel package represented as an offer. */
        BaseOffer: {
            /**
             * @description The specific subtype of an Offer.
             * @example FlightOffer
             */
            type: string;
            /**
             * @description The unique offer identifier.
             * @example 123eww324
             */
            id: string;
            /**
             * Format: date-time
             * @description The exact point in time at which the offer was created. It depends on the data source that was used for the search, expressed in UTC.
             * @example 2020-10-28T11:11:21.125Z
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description The expiration timestamp for the offer, expressed in UTC. UTC.
             * @example 2020-10-28T11:11:21.125Z
             */
            validUntil: string;
            /** @description The origin of the offer. */
            source: components["schemas"]["Source"];
            /** @description The total price of all mandatory offer's items. */
            totalPrice: components["schemas"]["TotalPrice"];
            /** @description Lists the items within an offer, which may include a Flight (priced itinerary) or an Ancillary not already included in the itinerary price. */
            items?: components["schemas"]["BaseOfferItem"][];
            /**
             * Format: date-time
             * @description The date by which a commitment to pay must be made for the confirmed items in an offer.
             * @example 2020-10-28T11:11:21.125Z
             */
            paymentTimeLimit?: string;
            /** @description The list of applicable PCCs for the offer. */
            applicableToPseudoCityCodes?: string[];
            /** @description Lists the journeys to which the offer applies. */
            journeyRefs?: string[];
            /**
             * @description If `true`, indicates that the offer item contains only non‑stop journeys. Returned in PriceOnly mode when flight information is unavailable. When true, indicates that offer item contains only non stop journeys.
             * @example false
             */
            isNonStop?: boolean;
        };
        /** @description Contains the details of a purchasable flight travel package. */
        VirtualInterlineOffer: Omit<components["schemas"]["BaseOffer"], "type"> & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "VirtualInterlineOffer";
        };
        /** @description Contains the comprehensive details of a purchasable flight travel package. */
        FlightOffer: Omit<components["schemas"]["BaseOffer"], "type"> & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "FlightOffer";
        };
        /** @description Contains the basic details of an offer item. */
        BaseOfferItem: {
            /**
             * @description The subtype of an OfferItem.
             * @example FlightOfferItem
             */
            type: string;
            /**
             * @description The unique ID of the offer item used to track and progress the order through the workflow.
             * @example 123eww324-1-1
             */
            id: string;
            /**
             * @description If `true`, indicates that the Offer Item is mandatory and cannot be removed from the Offer. These items automatically transition into Order Items. If false, the Offer Item is considered optional. This indicator is required at the Fare level and applies to both ATPCO and NDC content. content. If set to `true` indicates mandatory Offer Items that can't be removed from the Offer. Mandatory Offer Items transition into Order Items. If `false`, the Offer item is optional.
             * @default true
             */
            isMandatory: boolean;
        };
        /** @description Contains information on a virtual interline offer item. */
        VirtualInterlineOfferItem: Omit<components["schemas"]["BaseOfferItem"], "type"> & {
            /**
             * @description Lists the references for the offer.
             * @example [
             *       "123eww323",
             *       "123eww324"
             *     ]
             */
            offerRefs: string[];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "VirtualInterlineOfferItem";
        };
        FlightOfferItem: Omit<components["schemas"]["BaseOfferItem"], "type"> & {
            /** @description Lists the fare details for the given flight offer. */
            fares: components["schemas"]["FareDetail"][];
            /**
             * @description If `true`, indicates that the offer covers the entire trip in a one-way or multi-ticket scenario. part of trip or whole.
             * @default false
             */
            isPartial: boolean;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "FlightOfferItem";
        };
        Error: {
            /**
             * @description The classification of errors, distinguishing between client-side and server-side issues. (client-side or server-side) problem occurred.
             * @example BAD_REQUEST
             */
            category: string;
            /**
             * @description The application-specific error type or a standard value from the list of typical Sabre API errors. Sabre API errors.
             * @example REQUIRED_FIELD_MISSING
             */
            type: string;
            /**
             * @description The human-readable description of the error, providing sufficient detail to assist a software developer in debugging the problem. information that a software developer can use to debug the problem.
             * @example Client did not provide required data. See fieldName for the item expected in the request.
             */
            description?: string;
            /**
             * @description The additional debugging information, such as the name of a property missing from the request payload.
             * @example currencyCode
             */
            fieldName?: string;
            /**
             * @description The specific supplemental information provided to assist in debugging the error, such as the name of a missing property in the request payload. example the name of property missing from a request payload.
             * @example currencyCode
             */
            fieldPath?: string;
            /**
             * @description The reference to the invalid field value that triggered the error response.
             * @example field value
             */
            fieldValue?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    flightsearch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Search for flight offers using preferred criteria for open dates or destinations. The API allow's to search from airport or city to anywhere (empty, airport, city, country, region, theme), anytime (with default ranges). */
        requestBody: {
            content: {
                "application/json": components["schemas"]["FlightSearchRequest"];
            };
        };
        responses: {
            /** @description Successful response unless `errors` element is returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FlightSearchResponse"];
                };
            };
        };
    };
}
