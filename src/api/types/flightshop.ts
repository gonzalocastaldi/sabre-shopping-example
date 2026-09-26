// Generado por scripts/gen-types.mjs desde specs/flightshop.yml. No editar a mano.

export interface paths {
    "/flightShop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Creates flight offers by retrieving content from multiple shopping sources. */
        post: operations["flightShop"];
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
        /** @description Contains the period in which an event is or isn't expected to occur. */
        TimeWindow: {
            /**
             * @description Defines the window starting time in `HH:MM` format.
             * @example 09:15
             */
            startTime: string;
            /**
             * @description Defines the window ending time in `HH:MM` format.
             * @example 13:45
             */
            endTime: string;
        };
        /** @description Contains the requested journey. */
        RequestedJourney: {
            /** @description Contains a departure city or airport IATA code. */
            departureLocation: components["schemas"]["Location"];
            /** @description Contains an arrival city or airport IATA code. */
            arrivalLocation: components["schemas"]["Location"];
            /**
             * Format: date
             * @description The departure date in `YYYY-MM-DD` format in the departure location's time zone.
             * @example 2019-07-09
             */
            departureDate: string;
            /** @description Contains a departure time window. */
            departureTimeWindow?: components["schemas"]["TimeWindow"];
            /** @description Contains an arrival time window. */
            arrivalTimeWindow?: components["schemas"]["TimeWindow"];
        };
        /** @description Contains either a city or airport IATA code with an optional radius. */
        Location: components["schemas"]["CityCodeLocation"] | components["schemas"]["AirportCodeLocation"];
        /** @description Contains a city IATA code. */
        CityCodeLocation: {
            /** @description Contains the radius to which to extend the search from the provided location. */
            radius?: components["schemas"]["LocationRadius"];
            /**
             * @description The IATA code of a city.
             * @example NYC
             */
            cityCode?: string;
        };
        /** @description Contains an airport IATA code. */
        AirportCodeLocation: {
            /** @description Contains the radius to which to extend the search from the provided location. */
            radius?: components["schemas"]["LocationRadius"];
            /**
             * @description The IATA code of an airport.
             * @example DFW
             */
            airportCode?: string;
        };
        /** @description Contains a search radius. Can be limited to a radius value `inMiles` and `returnOnlyWithinSameCountry`. */
        LocationRadius: {
            /**
             * Format: int32
             * @description The radius distance value in miles.
             * @example 50
             */
            inMiles: number;
            /**
             * @description If `true`, the radius search is limited to the same origin or destination country.
             * @default true
             */
            returnOnlyWithinSameCountry: boolean;
        };
        /** @description Contains additional search parameters related to the requested route. */
        RequestedRoute: {
            /**
             * Format: int32
             * @description The maximum number of stops or connections allowed in each direction of the requested journey.
             * @example 2
             */
            maximumNumberOfStops?: number;
            /**
             * Format: int32
             * @description Minimum connection time in minutes.
             * @example 90
             */
            minimumConnectionTimeInMinutes?: number;
            /**
             * Format: int32
             * @description Maximum connection time in minutes.
             * @example 180
             */
            maximumConnectionTimeInMinutes?: number;
            /** @description Contains a time window when no connection is allowed. */
            excludedConnectionTimeWindow?: components["schemas"]["TimeWindow"];
            /** @description Defines parameters for long connections that are allowed in addition to regular connection time range. */
            allowedLongConnections?: components["schemas"]["AllowedLongConnections"];
        };
        /** @description Defines parameters for allowed long connections within a journey. */
        AllowedLongConnections: {
            /**
             * Format: int32
             * @description Minimum connection time in minutes for a long connection. This value sets a clear boundary between short connection range and long connections territory.
             * @example 1000
             */
            minimumConnectionTimeInMinutes: number;
            /**
             * Format: int32
             * @description Maximum connection time in minutes for a long connection.
             * @example 1300
             */
            maximumConnectionTimeInMinutes?: number;
            /**
             * Format: int32
             * @description Maximum number of long connections allowed per journey. Defaults to 1 if not specified.
             * @default 1
             * @example 1
             */
            maximumNumberOfLongConnections: number;
        };
        /**
         * @description Identifies an airline alliance.
         * @example Star Alliance
         * @enum {string}
         */
        AirlineAlliancesEnum: "Star Alliance" | "OneWorld" | "Skyteam";
        /** @description Contains airline filters for marketing and operating airlines. */
        RequestedAirlines: components["schemas"]["RequestedAirlinesAllSources"] | components["schemas"]["RequestedAirlinesBySource"];
        /** @description Contains airline filters for marketing and operating airlines. */
        RequestedAirlinesAllSources: {
            /** @description Contains filters for marketing airlines. */
            marketingAirlinesFilter?: components["schemas"]["AirlinesFilter"];
            /** @description Contains filters for operating airlines. */
            operatingAirlinesFilter?: components["schemas"]["AirlinesFilter"];
            /** @description Contains preferences on airline alliances. */
            airlineAlliancesFilter?: components["schemas"]["AirlineAlliancesFilter"];
        };
        AirlinesBySourceFilter: {
            /** @description Limit source to listed provider. */
            provider: components["schemas"]["ProviderTypeEnum"];
            /** @description Limit source to listed distribution models. */
            distributionModels?: components["schemas"]["DistributionModelTypeEnum"][];
            /** @description Filters marketing airlines. */
            marketingAirlinesFilter?: components["schemas"]["AirlinesFilter"];
            /** @description Filters operating airlines. */
            operatingAirlinesFilter?: components["schemas"]["AirlinesFilter"];
        };
        RequestedAirlinesBySource: {
            /** @description Contains airline filters for marketing and operating airlines. */
            sourceFilters?: components["schemas"]["AirlinesBySourceFilter"][];
        };
        /** @description Contains filters restricting airlines. */
        AirlinesFilter: {
            /** @description Lists airlines to return in the response. */
            airlineCodes?: string[];
        } | {
            /** @description Lists airlines to exclude from the response. */
            excludeAirlineCodes?: string[];
        };
        /** @description Contains filters restricting airline alliances. */
        AirlineAlliancesFilter: {
            /** @description Lists airline alliances to return in the response. */
            alliances?: components["schemas"]["AirlineAlliancesEnum"][];
        } | {
            /** @description Lists airline alliances to exclude from the response. */
            excludeAlliances?: components["schemas"]["AirlineAlliancesEnum"][];
        };
        /** @description Contains flight diversity parameters. */
        Diversity: {
            /**
             * Format: int32
             * @description The number of non-stop solutions to return. Applicable to ATPCO.
             * @example 2
             */
            numberOfNonStops?: number;
        };
        /** @description Contains processing options that enable special features of offer generation. */
        ProcessingOptions: {
            /**
             * @description The Point of Sale identifier (PCC) to shop in.
             * @example PC18
             */
            pseudoCityCode?: string;
            /**
             * @description Triggers the desired shopping profile and service.
             * @example abc12345
             */
            configurationId?: string;
            /**
             * Format: int32
             * @description The number of offer results to return in the response.
             * @example 1000
             */
            limitNumberOfOffers?: number;
            /**
             * @description If `true`, returns one-way solutions in addition to full journey solutions.
             * @default false
             */
            returnOneWays: boolean;
            /**
             * @description If `true`, returns virtual interline solutions in addition to full journey solutions.
             * @default false
             */
            returnVirtualInterlines: boolean;
        };
        /** @description Contains filters used to restrict content sources. */
        ContentFilter: {
            /**
             * @description Identifies the content provider for filtering based on provider-specific metadata.
             *     Note that `customContents` filtering is currently only supported for `Third Party` providers.
             */
            provider: components["schemas"]["ProviderTypeEnum"];
            /** @description Lists custom metadata tags, defined and maintained by the content provider, to use as flight offer filters. */
            customContents: components["schemas"]["CustomContent"][];
        };
        /** @description Contains a custom metadata tag to use as a flight offer filter. */
        CustomContent: {
            /**
             * @description The unique identifier key.
             * @example Key
             */
            key: string;
            /**
             * @description The value associated with the custom metadata key.
             * @example Partner
             */
            value: string;
        };
        /** @description Contains a request to shop for flight offers. */
        FlightShopRequest: {
            /** @description Lists traveler trip criteria. */
            journeys: components["schemas"]["RequestedJourney"][];
            /** @description Lists traveler types for which the API generates offers. In the response, offers are associated to passengers from this list using the array index. */
            travelers: components["schemas"]["RequestedTraveler"][];
            /** @description Contains qualifiers that modify the requested trip. */
            route?: components["schemas"]["RequestedRoute"];
            /** @description Contains preferred and/or non-preferred carriers that the API is expected to process and/or exclude from processing. */
            airlines?: components["schemas"]["RequestedAirlines"];
            /** @description Contains flight diversity options. */
            diversity?: components["schemas"]["Diversity"];
            /** @description Contains offer price filters. */
            fare?: components["schemas"]["RequestedFare"];
            /** @description Contains qualifiers that allow you to obtain retailing features. */
            retailing?: components["schemas"]["RequestedRetailingAttributes"];
            /** @description Contains providers and distribution models to filter from the final response. */
            sources?: components["schemas"]["SourcesFilter"];
            /** @description Lists qualifiers that filter by provider-specific attributes that aren't part of the standard flight shopping criteria. */
            contentFilters?: components["schemas"]["ContentFilter"][];
            /** @description Contains options that enable special features of offer generation. */
            processingOptions?: components["schemas"]["ProcessingOptions"];
        };
        /** @description Contains the response with flight offers returned by the API. */
        FlightShopResponse: {
            /**
             * Format: date-time
             * @description The server timestamp when the response was generated.
             * @example 2019-09-09T09:09:09Z
             */
            timestamp: string;
            /** @description Lists available flights that match the request criteria. */
            flights?: components["schemas"]["Flight"][];
            /** @description Lists journeys with references to `flights`. */
            journeys?: components["schemas"]["Journey"][];
            /** @description Lists applicable tax or fee items. */
            taxItems?: components["schemas"]["TaxItem"][];
            /** @description Lists offers with references to `journeys`. */
            offers?: components["schemas"]["BaseOffer"][];
            /** @description Contains baggage and flexibility information associated with the search. */
            offerAttributes?: components["schemas"]["OfferAttributes"];
            /** @description Lists detailed error information. For a successful response, this array isn't returned. */
            errors?: components["schemas"]["Error"][];
            /** @description Lists detailed warning information. */
            warnings?: components["schemas"]["Error"][];
        };
        /** @description Contains a custom metadata tag defined and maintained by the content provider. */
        CustomContentResponse: {
            /**
             * @description The unique identifier key for the custom content object.
             * @example Connector
             */
            key: string;
            /**
             * @description The value associated with the custom content key.
             * @example Partner
             */
            value: string;
        };
        /** @description Contains an offer, which represents a purchasable flight travel package. */
        BaseOffer: components["schemas"]["BaseOfferAttributes"] & {
            /** @description Lists items within the offer that aren't already included in the price of the itinerary, such as flights or ancillaries. */
            items: components["schemas"]["BaseOfferItem"][];
        };
        /** @description Contains the basic details of an offer item. */
        BaseOfferItem: components["schemas"]["BaseOfferItemAttributes"];
        /** @description Contains a purchasable flight travel package. */
        FlightOffer: Omit<components["schemas"]["BaseOffer"], "type"> & components["schemas"]["FlightOfferAttributes"] & {
            /** @description Lists custom metadata tags, defined and maintained by the content provider, to use as flight offer filters. */
            customContents?: components["schemas"]["CustomContentResponse"][];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "FlightOffer";
        };
        /** @description Contains information on a flight offer item. */
        FlightOfferItem: Omit<components["schemas"]["BaseOfferItem"], "type"> & components["schemas"]["FlightOfferItemAttributes"] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "FlightOfferItem";
        };
        /** @description Contains a virtual interline offer, which represents a purchasable flight travel package. */
        VirtualInterlineOffer: Omit<components["schemas"]["BaseOffer"], "type"> & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "VirtualInterlineOffer";
        };
        /** @description Contains information on a virtual interline offer item. */
        VirtualInterlineOfferItem: Omit<components["schemas"]["BaseOfferItem"], "type"> & {
            /**
             * @description Lists the IDs of associated virtual interline offers.
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
        /** @description Contains a definition of a flight loyalty program. */
        LoyaltyProgram: {
            /**
             * @description The frequent-flyer vendor code. Can be a two-digit alphanumeric IATA code or a three-letter ICAO code. Applicable only to NDC.
             * @example AA
             */
            supplierCode: string;
            /**
             * @description The airline frequent-flyer number. Applicable only to NDC.
             * @example 11233
             */
            programNumber: string;
        };
        /** @description Contains a definition of a traveler type (passenger type). */
        RequestedTraveler: {
            /**
             * @description The traveler type code (passenger type code).
             * @example ADT
             */
            passengerTypeCode: string;
            /**
             * @description The traveler's first name. Applicable only to NDC.
             * @example John
             */
            givenName?: string;
            /**
             * @description The traveler's last name. Applicable only to NDC.
             * @example Smith
             */
            surname?: string;
            /** @description Lists airline loyalty programs applicable to the passenger. */
            loyaltyPrograms?: components["schemas"]["LoyaltyProgram"][];
        };
        /**
         * @description Identifies the data source provider from whom offers are expected.
         * @example Sabre
         * @enum {string}
         */
        ProviderTypeEnum: "Sabre" | "Direct" | "Third Party";
        /**
         * @description Identifies a distribution model or systems or companies that host carrier APIs from which offers are expected.
         * @example ATPCO
         * @enum {string}
         */
        DistributionModelTypeEnum: "ATPCO" | "API" | "NDC";
        /**
         * @description Identifies which cabin processing logic applies. `Keep Same Cabin` applies only to ATPCO and NDC.
         * @default Avoid Cabin Downgrade - Main Flight
         * @example Jump Cabin
         * @enum {string}
         */
        CabinLogicEnum: "Jump Cabin" | "Keep Same Cabin" | "Avoid Cabin Downgrade - All Flights" | "Avoid Cabin Downgrade - Main Flight";
        /**
         * @description Identifies a cabin name for which offers should be generated.
         * @example Economy
         * @enum {string}
         */
        CabinNameEnum: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy";
        /** @description Contains the preferred cabin type. */
        RequestedCabin: {
            /** @description Identifies which cabin processing logic applies. */
            logic?: components["schemas"]["CabinLogicEnum"];
            /** @description Identifies the aircraft cabin in which the API should generate offers. */
            name?: components["schemas"]["CabinNameEnum"];
        };
        /** @description Contains the preferred cabin type that the API applies to the selected journeys. */
        CabinPerJourneyPreferences: {
            /** @description Identifies the aircraft cabin in which the API should generate offers. */
            name: components["schemas"]["CabinNameEnum"];
            /** @description Lists the indices of the journeys within the `journeys` array to which the selected cabin type applies. */
            journeyIndices: number[];
        };
        /** @description Contains the preferred cabin type that the API applies per journey selection. */
        RequestedCabinPerJourney: {
            /** @description Identifies which cabin processing logic applies. */
            logic?: components["schemas"]["CabinLogicEnum"];
            /** @description Lists preferred cabin types that can be selected within each journey. */
            preferences?: components["schemas"]["CabinPerJourneyPreferences"][];
        };
        /** @description Contains qualifiers with cabin preferences and cabin processing logic. */
        FareCabin: components["schemas"]["RequestedCabin"] | components["schemas"]["RequestedCabinPerJourney"];
        /**
         * @description Identifies the source of a code for which the traveler may have fares filed. Can be an ATPCO `Account Code`, a Sabre `Corporate Id`, or an NDC `Company Id` or `Promo Code`.
         * @default Account Code
         * @enum {string}
         */
        FareProgramTypeEnum: "Account Code" | "Corporate Id" | "Company Id" | "Promo Code";
        /** @description Contains programs that agencies and airlines use for fare filing purposes. These are usually private fares available to a limited number of customers. */
        FareProgram: {
            /** @description List distribution models of the fare programs. */
            distributionModels: components["schemas"]["DistributionModelTypeEnum"][];
            /** @description Identifies the fare program type associated with the distribution model. Allows the API to generate offers with fares filed with this type. */
            type: components["schemas"]["FareProgramTypeEnum"];
            /** @description Lists values associated to the qualifier's `type`. */
            values: string[];
            /**
             * @description The type of company ID. Applicable only to NDC.
             * @example ABN
             */
            companyIdType?: string;
            /**
             * @description The airline or vendor account code. Mandatory for NDC.
             * @example AA
             */
            airlineCode?: string;
        };
        /**
         * @description Type of fare.
         * @example Public
         * @enum {string}
         */
        RestrictFaresEnum: "Public" | "Private";
        /** @description Contains offer price filters. */
        RequestedFare: {
            /**
             * @description The three-letter currency code in the ISO 4217 standard preferred for retrieving monetary values.
             * @example USD
             */
            currencyCode?: string;
            /** @description Contains the cabin name and cabin processing logic. */
            cabin?: components["schemas"]["FareCabin"];
            /**
             * @description If `true`, returns fares matching the requested passenger code on all fare components.
             * @default false
             */
            forcePassengerType: boolean;
            /**
             * @description If `true`, processes Interline Ticketing Agreements. Applicable only to ATPCO.
             * @default false
             */
            validateInterlineTicketingAgreement: boolean;
            /** @description Lists allowed validating carriers. Applicable only to ATPCO, pre-charged. */
            validatingAirlineCodes?: string[];
            /** @description Lists fare programs for different distribution models and their corresponding qualifiers. */
            programs?: components["schemas"]["FareProgram"][];
            /**
             * @description If `true`, returns an itemized breakdown of taxes and fees for each offer when available. A detailed tax and fee breakdown is only guaranteed for offers originating from the ATPCO distribution model and provided by Sabre. For other offers, this information may be unavailable and omitted in the response.
             * @default false
             * @example false
             */
            returnTaxBreakdown: boolean;
            /** @description Limits the search to desired fare type. */
            restrictFaresTo?: components["schemas"]["RestrictFaresEnum"];
            /**
             * @description If set to true, the response will include only fares matching provided program code. Works only if programs are provided.
             * @default false
             * @example false
             */
            restrictToProgramCodes: boolean;
        };
        /**
         * @description Identifies a characteristic of an airline product.
         * @enum {string}
         */
        RetailingOfferAttributesEnum: "Baggage" | "Flexibility" | "Carbon Emissions";
        /** @description Contains retailing attributes that you can use to refine a flight search. */
        RetailingOfferAttributesFilter: {
            /**
             * @description If `true`, returns only fare options that include free baggage. Any fares that don't include at least one free bag are excluded from the search.
             * @default false
             * @example true
             */
            hasFreeBaggage: boolean;
            /**
             * @description If `true`, returns only fare options that include free carry-on baggage.
             * @default false
             * @example true
             */
            hasFreeCarryOnBaggage: boolean;
            /**
             * @description If `true`, returns only fare options that include a free refund.
             * @default false
             * @example true
             */
            hasFreeRefund: boolean;
            /**
             * @description If `true`, returns only fare options that include a free exchange.
             * @default false
             * @example true
             */
            hasFreeChange: boolean;
            /**
             * @description If `true`, returns only fare options that include refund capabilities.
             * @default false
             * @example true
             */
            isRefundAllowed: boolean;
            /**
             * @description If `true`, returns only fare options that include exchange capabilities.
             * @default false
             * @example true
             */
            isChangeAllowed: boolean;
        };
        /** @description Contains the number of additional offer solutions to return. */
        ReturnAdditionalOffers: {
            /**
             * Format: int32
             * @description The number of additional offer solutions to return.
             * @default 4
             */
            numberOfAdditionalOffers: number;
        };
        /** @description Contains retailing attributes to decorate the response with. */
        RequestedRetailingAttributes: {
            /** @description Lists airline product characteristics that together form a unique offer. */
            returnOfferAttributes?: components["schemas"]["RetailingOfferAttributesEnum"][];
            /** @description Contains retailing attribute filters that you can use to refine a flight search. */
            filterByOfferAttributes?: components["schemas"]["RetailingOfferAttributesFilter"];
            /** @description Contains the number of additional offer solutions to return per journey. */
            returnAdditionalOffers?: components["schemas"]["ReturnAdditionalOffers"];
        };
        /** @description Contains providers and distribution models to filter from or to include in the final response. */
        SourcesFilter: {
            /** @description Lists providers to return offers from. */
            providers?: components["schemas"]["ProviderTypeEnum"][];
            /** @description Lists distribution models to return offers from. */
            distributionModels?: components["schemas"]["DistributionModelTypeEnum"][];
        } | {
            /** @description Lists providers to exclude from the response. */
            excludeProviders?: components["schemas"]["ProviderTypeEnum"][];
            /** @description Lists distribution models to exclude from the response. */
            excludeDistributionModels?: components["schemas"]["DistributionModelTypeEnum"][];
        };
        /** @description Contains details of a hidden stop in a flight. */
        HiddenStop: {
            /**
             * @description The three-letter IATA airport code of the stopover point.
             * @example DFW
             */
            airportCode: string;
            /**
             * Format: date
             * @description The arrival date in the airport time zone.
             * @example 2024-01-26
             */
            arrivalDate?: string;
            /**
             * @description The arrival time in the airport time zone.
             * @example 15:00
             */
            arrivalTime?: string;
            /**
             * Format: date
             * @description The departure date in the airport time zone.
             * @example 2024-01-26
             */
            departureDate?: string;
            /**
             * @description The departure time in the airport time zone.
             * @example 17:55
             */
            departureTime?: string;
            /**
             * Format: int32
             * @description Stop duration in minutes.
             * @example 90
             */
            durationInMinutes?: number;
            /**
             * @description If `true`, a change of aircraft is required.
             * @default false
             */
            hasChangeOfGauge: boolean;
            /**
             * @description The IATA code of the aircraft type.
             * @example 346
             */
            aircraftTypeCode?: string;
            /**
             * @description The terminal at the departure airport.
             * @example 1
             */
            departureTerminal?: string;
            /**
             * @description The terminal at the arrival airport.
             * @example 2
             */
            arrivalTerminal?: string;
        };
        /** @description Contains details of a flight. */
        Flight: {
            /**
             * Format: uuid
             * @description The ID of the flight.
             * @example bf74c8ee-393a-45c8-8f15-a27fa6395050
             */
            id?: string;
            /**
             * @description The three-letter IATA code of the departure airport.
             * @example DFW
             */
            departureAirportCode?: string;
            /**
             * Format: date
             * @description The departure date in the airport time zone.
             * @example 2024-01-26
             */
            departureDate?: string;
            /**
             * @description The departure time in the airport time zone.
             * @example 17:55
             */
            departureTime?: string;
            /**
             * @description The three-letter IATA code of the arrival airport.
             * @example FRA
             */
            arrivalAirportCode?: string;
            /**
             * Format: date
             * @description The arrival date in the airport time zone.
             * @example 2024-01-26
             */
            arrivalDate?: string;
            /**
             * @description The arrival time in the airport time zone.
             * @example 15:00
             */
            arrivalTime?: string;
            /**
             * @description The IATA code of the operating carrier.
             * @example AA
             */
            operatingAirlineCode?: string;
            /**
             * Format: int32
             * @description The operating carrier flight number.
             * @example 1001
             */
            operatingFlightNumber?: number;
            /**
             * @description The IATA code of the marketing carrier.
             * @example AA
             */
            marketingAirlineCode?: string;
            /**
             * Format: int32
             * @description The marketing carrier flight number.
             * @example 1001
             */
            marketingFlightNumber?: number;
            /**
             * @description The disclosure carrier code or name.
             * @example AA
             */
            disclosureAirlineCode?: string;
            /**
             * @description The IATA code of the aircraft type.
             * @example 346
             */
            aircraftTypeCode?: string;
            /**
             * Format: int32
             * @description Flight duration in minutes.
             * @example 90
             */
            durationInMinutes?: number;
            /** @description Lists hidden stops during the flight in chronological order. */
            hiddenStops?: components["schemas"]["HiddenStop"][];
            /**
             * @description The terminal at the departure airport.
             * @example 1
             */
            departureTerminal?: string;
            /**
             * @description The terminal at the arrival airport.
             * @example 2
             */
            arrivalTerminal?: string;
        };
        /** @description Contains a portion of travel. A round trip consists of two journeys (for example, outbound and inbound). */
        Journey: {
            /**
             * Format: uuid
             * @description The ID of the journey.
             * @example ccc04ff0-d5ce-4314-9cbc-f01ec6bb91ab
             */
            id?: string;
            /** @description Lists flight references for the journey. */
            flightRefs?: string[];
            /**
             * Format: int32
             * @description The zero-based index matching the journey in the request.
             * @example 0
             */
            requestedJourneyIndex?: number;
        };
        /** @description Contains a tax or fee item. */
        TaxItem: {
            /**
             * Format: uuid
             * @description The ID of the tax item.
             * @example 7af78393-6d45-3d22-856d-3f6c515d6652
             */
            id: string;
            /**
             * @description The tax code.
             * @example QX
             */
            taxCode: string;
            /**
             * Format: number
             * @description The tax or fee amount.
             * @example 16.04
             */
            amount: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with the charge.
             * @example USD
             */
            currencyCode: string;
            /**
             * Format: number
             * @description The tax or fee amount as originally published.
             * @example 15.54
             */
            publishedAmount?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with `publishedAmount`.
             * @example EUR
             */
            publishedCurrencyCode?: string;
            /**
             * @description The name of the tax or fee.
             * @example PASSENGER SERVICE CHARGE INTERNATIONAL
             */
            taxDescription?: string;
            /**
             * @description The IATA code of the airport at which the tax is applicable.
             * @example CDG
             */
            airportCode?: string;
            /**
             * @description The ISO 3166 code of the country that levies the tax. Not applicable to carrier-imposed fees.
             * @example FR
             */
            taxCountry?: string;
        };
        /** @description Contains the basic details of a purchasable flight travel package. */
        FlightOfferAttributes: {
            /**
             * Format: uuid
             * @description The ID of a refundability attribute associated with the offer.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            refundabilityRef?: string;
            /**
             * Format: uuid
             * @description The ID of a change attribute associated with the offer.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            changeRef?: string;
            /**
             * @description Lists the IDs of reference offers or upsells that are similar to the offer contained in this object.
             * @example [
             *       "123eww323"
             *     ]
             */
            additionalOffersRefs?: string[];
        };
        /**
         * @description Identifies a data source provider from whom offers are expected.
         * @default Unknown
         * @example Sabre
         * @enum {string}
         */
        ProviderTypeResponseEnum: "Sabre" | "Direct" | "Third Party" | "Unknown";
        /**
         * @description Identifies a distribution model or systems or companies that host carrier APIs from which offers are expected.
         * @default Unknown
         * @example ATPCO
         * @enum {string}
         */
        DistributionModelTypeResponseEnum: "ATPCO" | "API" | "NDC" | "Mixed" | "Unknown";
        /**
         * @description Identifies a distribution model or systems or companies that host carrier APIs from which offers are expected.
         * @default Unknown
         * @example Connect
         * @enum {string}
         */
        CommercialModelTypeResponseEnum: "Connect" | "Unknown";
        /** @description Contains the origin of an offer. */
        Source: {
            /** @description Identifies the data provider. */
            provider?: components["schemas"]["ProviderTypeResponseEnum"];
            /**
             * @description The identifier of the data supplier.
             * @example VA
             */
            supplier?: string;
            /** @description Identifies the data distribution model. */
            distributionModel?: components["schemas"]["DistributionModelTypeResponseEnum"];
            /** @description Identifies the data commercial model. */
            commercialModel?: components["schemas"]["CommercialModelTypeResponseEnum"];
        };
        /** @description Contains the total price of all offer items within an offer. */
        TotalPrice: {
            /**
             * Format: number
             * @description Defines a total amount.
             * @example 33.30
             */
            amount: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with `amount`.
             * @example USD
             */
            currencyCode: string;
        };
        /** @description Contains the basic parameters of an offer, which represents a purchasable flight travel package. */
        BaseOfferAttributes: {
            /**
             * @description The offer subtype.
             * @example FlightOffer
             */
            type: string;
            /**
             * @description The ID of the offer.
             * @example 123eww324
             */
            id: string;
            /**
             * Format: date-time
             * @description The exact point in time when the offer was created, expressed in UTC. Depends on the data source that was used for the search.
             * @example 2020-10-28T11:11:21.125Z
             */
            createdAt: string;
            /**
             * Format: date-time
             * @description The exact point in time when the offer expires, expressed in UTC.
             * @example 2020-10-28T11:11:21.125Z
             */
            validUntil: string;
            /** @description Contains the origin of the offer. */
            source: components["schemas"]["Source"];
            /** @description Contains the total price of all mandatory offer items. */
            totalPrice: components["schemas"]["TotalPrice"];
            /**
             * Format: date-time
             * @description The date by which a commitment to pay for the confirmed offer items must be made.
             * @example 2020-10-28T11:11:21.125Z
             */
            paymentTimeLimit?: string;
            /** @description Lists PCCs that the offer applies to. */
            applicableToPseudoCityCodes?: string[];
            /** @description Lists IDs of journeys that the offer applies to. */
            journeyRefs?: string[];
        };
        /** @description Contains a traveler type for which fares were generated, along with the index of the passenger from the request. */
        ReturnedTraveler: {
            /**
             * @description The ID of the passenger used to generate the offer.
             * @example Passenger1
             */
            id?: string;
            /**
             * @description The passenger type used to generate the offer.
             * @example ADT
             */
            passengerTypeCode: string;
            /**
             * Format: int32
             * @description The zero-based index of the traveler from the request for whom the offer was generated.
             * @example 0
             */
            requestedTravelerIndex: number;
        };
        /** @description Contains a total fare price, including taxes and surcharges. */
        Fares: {
            /**
             * Format: number
             * @description The net fare amount.
             * @example 16.74
             */
            equivalentFare?: string;
            /**
             * Format: number
             * @description The total tax amount.
             * @example 16.56
             */
            taxAmount?: string;
            /**
             * Format: number
             * @description The total amount, including flight fare, taxes and surcharges.
             * @example 33.30
             */
            amount?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with amounts.
             * @example USD
             */
            currencyCode?: string;
        };
        /**
         * @description Identifies a type of private fare.
         * @example Has Program Code
         * @enum {string}
         */
        PrivateFareIndicatorEnum: "Has Program Code" | "Ineligible For Ticketing" | "Any";
        /**
         * @description Identifies the cabin for which the API generated offers.
         * @default Unknown
         * @example Economy
         * @enum {string}
         */
        CabinNameResponseEnum: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy" | "Unknown";
        /** @description Contains details of a fare component associated with a specific segment of the journey. */
        FareComponentSegmentDetail: {
            /**
             * Format: uuid
             * @description The ID of the flight.
             * @example bf74c8ee-393a-45c8-8f15-a27fa6395050
             */
            flightRef: string;
            /**
             * @description The Reservation Booking Designator (booking code) applicable to the journey segment for which the fare was calculated.
             * @example M
             */
            bookingClassCode?: string;
            /** @description Identifies the cabin name associated with the journey segment for which the fare was calculated. */
            cabinName?: components["schemas"]["CabinNameResponseEnum"];
            /**
             * Format: uuid
             * @description The ID of the checked baggage attribute associated with the fare component.
             * @example df58f912-7c38-416b-b97b-d73a8676f52c
             */
            checkedBaggageRef?: string;
            /**
             * Format: uuid
             * @description The ID of the carry-on baggage attribute associated with the fare component.
             * @example 75af09b1-ca5e-4b9b-a754-3297f516d147
             */
            carryOnBaggageRef?: string;
            /**
             * Format: int64
             * @description Carbon emissions from the fare cabin calculated in grams per passenger.
             * @example 667557
             */
            carbonEmissionsInGramsPerPassenger?: number;
        };
        /** @description Contains the brand associated with a fare component. */
        FareBrand: {
            /**
             * @description The code of the brand.
             * @example BASICECON
             */
            code?: string;
            /**
             * @description The name of the brand.
             * @example BASIC ECONOMY
             */
            name?: string;
            /**
             * Format: int32
             * @description The brand program ID.
             * @example 372463
             */
            programId?: number;
        };
        /**
         * @description Identifies a fare markup type.
         * @example Cat35
         * @enum {string}
         */
        MarkupTypeEnum: "Cat35" | "Other";
        /** @description Contains the markup applied to a fare component. */
        Markup: {
            /** @description Identifies the fare markup type. */
            type: components["schemas"]["MarkupTypeEnum"];
            /**
             * Format: number
             * @description The markup amount.
             * @example 15.00
             */
            amount: string;
            /**
             * Format: number
             * @description The fare amount with the markup applied.
             * @example 1215.00
             */
            fareAmountAfterMarkup?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with the amounts.
             * @example USD
             */
            currencyCode: string;
        };
        /** @description Contains a component of the fare calculated for a given itinerary. */
        FareComponent: {
            /**
             * Format: number
             * @description The net amount of the fare component.
             * @example 1.86
             */
            amount?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with `amount`.
             * @example USD
             */
            currencyCode?: string;
            /**
             * Format: number
             * @description The published net amount of the fare component.
             * @example 1.86
             */
            publishedAmount?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with `publishedAmount`.
             * @example USD
             */
            publishedCurrencyCode?: string;
            /**
             * Format: number
             * @description The exchange rate used to convert the construction fare amount published in the neutral unit of currency (NUC) to a published fare amount in the local currency of the trip origin.
             * @example 1.00000
             */
            exchangeRate?: string;
            /**
             * @description The fare basis associated with the fare component.
             * @example W7C1V2
             */
            fareBasisCode?: string;
            /**
             * @description The account code associated with the fare component.
             * @example ACC33
             */
            accountCode?: string;
            /** @description Lists corporate IDs associated with the fare component. */
            corporateIds?: string[];
            /** @description Lists segments associated with the fare component. */
            segmentDetails?: components["schemas"]["FareComponentSegmentDetail"][];
            /** @description Contains the brand associated with the fare component. */
            brand?: components["schemas"]["FareBrand"];
            /** @description Lists markup items applied to the fare component. */
            markups?: components["schemas"]["Markup"][];
            /**
             * Format: uuid
             * @description The ID of the refundability attribute associated with the fare component.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            refundabilityRef?: string;
            /**
             * Format: uuid
             * @description The ID of the change attribute associated with the fare component.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            changeRef?: string;
        };
        /**
         * @description Identifies a commission type.
         * @example Cat35
         * @enum {string}
         */
        CommissionTypesEnum: "Cat35" | "Other";
        /** @description Contains a negotiated commission originating from ATPCO Category 35 or other source. */
        Commissions: {
            /** @description Identifies the commission type. */
            type: components["schemas"]["CommissionTypesEnum"];
            /**
             * Format: number
             * @description The commission percentage. Returned only for percentage-based commissions.
             * @example 1.00
             */
            percentage?: string;
            /**
             * Format: number
             * @description The commission amount.
             * @example 43.24
             */
            amount: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with the commission.
             * @example SGD
             */
            currencyCode: string;
        };
        /** @description Contains a fare breakdown per traveler type. Multiple passengers of the same type are represented with a single `FareDetail` object. Passengers of different types require a separate `FareDetail` object per passenger type. */
        FareDetail: {
            /** @description Lists traveler types the fare is associated with. */
            travelers: components["schemas"]["ReturnedTraveler"][];
            /** @description Contains the total fare amount, including taxes and surcharges. */
            fareTotal: components["schemas"]["Fares"];
            /** @description Identifies the type of private fare. */
            privateFare?: components["schemas"]["PrivateFareIndicatorEnum"];
            /**
             * @description The IATA code of the validating carrier.
             * @example AA
             */
            validatingAirlineCode?: string;
            /** @description Lists fare components used to compute the fare. */
            fareComponents: components["schemas"]["FareComponent"][];
            /** @description Lists commissions applied to the fare. */
            commissions?: components["schemas"]["Commissions"][];
            /** @description Lists IDs of taxes and fees included in `fareTotal`. */
            taxItemRefs?: string[];
            /**
             * Format: uuid
             * @description The ID of the refundability attribute associated with the fare.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            refundabilityRef?: string;
            /**
             * Format: uuid
             * @description The ID of the change attribute associated with the fare.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            changeRef?: string;
        };
        /** @description Contains the basic details of an flight offer item. */
        FlightOfferItemAttributes: {
            /** @description Lists fare details for the flight offer item. */
            fares: components["schemas"]["FareDetail"][];
            /**
             * @description If `true`, the offer item covers only a part of the trip for one-way or multi-ticket travel.
             * @default false
             */
            isPartial: boolean;
        };
        /** @description Contains the basic details of an offer item. */
        BaseOfferItemAttributes: {
            /**
             * @description The subtype of the offer item.
             * @example FlightOfferItem
             */
            type: string;
            /**
             * @description The ID of the offer item. Used in the next steps of the Offer/Order workflow.
             * @example 123eww324-1-1
             */
            id: string;
            /**
             * @description If `true`, the offer item is mandatory and can't be removed from the offer. Mandatory offer items transition into order items. If `false`, the offer item is optional. Applicable for ATPCO and NDC content.
             * @default true
             */
            isMandatory: boolean;
        };
        /** @description Contains a baggage item that's included in the free baggage allowance or subject to baggage charges. */
        BaggageItemDefinition: {
            /**
             * Format: int32
             * @description The baggage weight in kilograms.
             * @example 23
             */
            weightInKilograms?: number;
            /**
             * Format: int32
             * @description The baggage weight in pounds.
             * @example 50
             */
            weightInPounds?: number;
            /**
             * Format: int32
             * @description The baggage size in inches.
             * @example 18
             */
            sizeInInches?: number;
            /**
             * Format: int32
             * @description The baggage size in centimeters.
             * @example 45
             */
            sizeInCentimeters?: number;
            /**
             * Format: int32
             * @description The baggage length in inches.
             * @example 18
             */
            lengthInInches?: number;
            /**
             * Format: int32
             * @description The baggage length in centimeters.
             * @example 45
             */
            lengthInCentimeters?: number;
            /**
             * Format: int32
             * @description The baggage height in inches.
             * @example 14
             */
            heightInInches?: number;
            /**
             * Format: int32
             * @description The baggage height in centimeters.
             * @example 35
             */
            heightInCentimeters?: number;
            /**
             * Format: int32
             * @description The baggage width in inches.
             * @example 8
             */
            widthInInches?: number;
            /**
             * Format: int32
             * @description The baggage width in centimeters.
             * @example 20
             */
            widthInCentimeters?: number;
            /** @description Lists baggage item descriptions in free-text format. */
            description?: string[];
        };
        /** @description Contains baggage that a traveler can take with them free of charge. */
        BaggageAllowances: {
            /**
             * Format: int32
             * @description The maximum number of pieces that are allowed free of charge.
             * @example 1
             */
            numberOfPieces?: number;
            /** @description Contains the baggage item that's allowed free of charge. */
            bagDefinition?: components["schemas"]["BaggageItemDefinition"];
            /**
             * Format: int32
             * @description The maximum total baggage weight in kilograms, applicable if the carrier doesn't define the limit in terms of pieces.
             * @example 30
             */
            maximumWeightInKilograms?: number;
            /**
             * Format: int32
             * @description The maximum total baggage weight in pounds, applicable if the carrier doesn't define the limit in terms of pieces.
             * @example 30
             */
            maximumWeightInPounds?: number;
            /**
             * @description The IATA code of the airline whose baggage provision applies.
             * @example AA
             */
            airlineCode?: string;
        };
        /** @description Contains a baggage charge for items that aren't part of the baggage allowance. */
        BaggageCharges: {
            /**
             * Format: int32
             * @description The start point of the inclusive `[firstPiece, lastPiece]` range for which the charge applies. The count starts from the first item that exceeds the free baggage allowance.
             * @example 1
             */
            firstPiece?: number;
            /**
             * Format: int32
             * @description The end point of the inclusive `[firstPiece, lastPiece]` range for which the charge applies. The count starts from the first item that exceeds the free baggage allowance.
             * @example 2
             */
            lastPiece?: number;
            /** @description Contains the baggage item to which the charge applies. */
            bagDefinition?: components["schemas"]["BaggageItemDefinition"];
            /**
             * Format: number
             * @description The amount payable per baggage item.
             * @example 128.00
             */
            amount?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with `amount`.
             * @example USD
             */
            currencyCode?: string;
            /**
             * @description The IATA code of the airline whose baggage provision applies.
             * @example AA
             */
            airlineCode?: string;
        };
        /** @description Contains baggage provisions, including free allowance for checked and carry-on baggage and charges for excess baggage items. */
        Baggage: {
            /**
             * Format: uuid
             * @description The ID of the baggage attribute.
             * @example df58f912-7c38-416b-b97b-d73a8676f52c
             */
            id: string;
            /** @description Lists baggage allowances applicable per portion of travel. */
            allowances?: components["schemas"]["BaggageAllowances"][];
            /** @description Lists baggage charges applicable per portion of travel. */
            charges?: components["schemas"]["BaggageCharges"][];
        };
        /** @description Contains conditions of voluntary changes and refunds as well as applicable fees. */
        FlexibilityRule: {
            /**
             * @description If `true`, ticket change and refund are permitted for a given fare, either free of charge (charge equals `0`) or with a fee.
             * @example true
             */
            isPermitted: boolean;
            /**
             * Format: number
             * @description The maximum cost of a ticket change or refund in a given fare.
             * @example 14.00
             */
            maxCharge?: string;
            /**
             * Format: number
             * @description The minimum cost of a ticket change or refund in a given fare.
             * @example 7.00
             */
            minCharge?: string;
            /**
             * @description The three-letter ISO 4217 currency code associated with the charge.
             * @example USD
             */
            currencyCode?: string;
        };
        /** @description Contains information about refund or change charges. */
        RefundChangeCharges: {
            /**
             * Format: uuid
             * @description The ID of the attribute.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            id: string;
            /** @description Contains change charges applicable before departure. */
            beforeDeparture?: components["schemas"]["FlexibilityRule"];
            /** @description Contains change charges applicable after departure. */
            afterDeparture?: components["schemas"]["FlexibilityRule"];
        };
        /** @description Contains baggage and flexibility information. */
        OfferAttributes: {
            /** @description Lists information about checked baggage. */
            checkedBaggageItems?: components["schemas"]["Baggage"][];
            /** @description Lists information about carry-on baggage. */
            carryOnBaggageItems?: components["schemas"]["Baggage"][];
            /** @description Lists information about refund charges. */
            refundabilityItems?: components["schemas"]["RefundChangeCharges"][];
            /** @description Lists information about change charges. */
            changeItems?: components["schemas"]["RefundChangeCharges"][];
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
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    flightShop: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Contains your preferred criteria for flight offer shopping. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["FlightShopRequest"];
            };
        };
        responses: {
            /** @description Successful response, unless the `errors` array is returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FlightShopResponse"];
                };
            };
        };
    };
}
