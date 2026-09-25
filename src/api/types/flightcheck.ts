// Generado por scripts/gen-types.mjs desde specs/flightcheck.yml. No editar a mano.

export interface paths {
    "/flightCheck": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Creates a real-time validation of a flight offer to confirm current pricing and availability details. */
        post: operations["flightCheck"];
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
        /** @description Contains qualifiers and processing options to include in a request. */
        FlightCheckRequestCommons: {
            /** @description Contains qualifiers which allow you to modify the offer price. */
            fare?: components["schemas"]["FlightCheckRequestedFare"];
            /** @description Contains qualifiers which allow you to obtain retailing features. */
            retailing?: components["schemas"]["RequestedRetailingAttributes"];
            /** @description Contains processing options that enable special features of offer generation. */
            processingOptions?: components["schemas"]["ProcessingOptions"];
        };
        /** @description Contains a request to revalidate an offer. */
        FlightCheckRequest: components["schemas"]["FlightCheckPayloadRequest"] | components["schemas"]["FlightCheckOfferRequest"];
        /** @description Contains a request to revalidate an offer using request payload data. */
        FlightCheckPayloadRequest: {
            /** @description Lists journeys in the offer. */
            journeys: components["schemas"]["ItineraryJourney"][];
            /** @description Lists traveler types in the offer. In the response, the offer is associated to a traveler from this array by their index. This parameter is required in payload-based requests and optional in requests based on `offerItemIDs`. */
            travelers: components["schemas"]["RequestedTraveler"][];
        } & components["schemas"]["FlightCheckRequestCommons"];
        /** @description Contains a request to revalidate an offer using an `offerItemIds` array. */
        FlightCheckOfferRequest: {
            /** @description Lists offer items to validate. */
            offerItemIds: string[];
            /** @description Lists traveler types in the offer. In the response, the offer is associated to a traveler from this array by their index. This parameter is required in payload-based requests and optional in requests based on `offerItemIDs`. */
            travelers?: components["schemas"]["RequestedTraveler"][];
            /** @description Contains the form of payment. */
            formOfPayment?: components["schemas"]["FormOfPayment"];
        } & components["schemas"]["FlightCheckRequestCommons"];
        /** @description Contains processing options that enable special features of offer generation. */
        ProcessingOptions: {
            /**
             * @description The Point of Sale ID (PCC). Applicable to ATPCO.
             * @example PC18
             */
            pseudoCityCode?: string;
            /**
             * @description Triggers the desired shopping profile and service.
             * @example abc12345
             */
            configurationId?: string;
        };
        /** @description Contains a form of payment. */
        FormOfPayment: {
            /** @description Identifies the method of payment. */
            type: components["schemas"]["FormOfPaymentEnum"];
            /** @description Contains credit or debit card details. Required for the `Credit or Debit Card` form of payment `type`. */
            cardDetails?: components["schemas"]["CardDetails"];
        };
        /**
         * @description Identifies a method of payment.
         * @enum {string}
         */
        FormOfPaymentEnum: "Credit or Debit Card" | "Cash";
        /** @description Contains credit or debit card details. */
        CardDetails: {
            /**
             * @description The two-letter payment card code.
             * @example MC
             */
            code: string;
            /**
             * @description The first six to eight digits of a credit or debit card number.
             * @example 545250
             */
            binNumber: string;
        };
        FlightCheckRequestedFare: components["schemas"]["RequestedFare"] & {
            /** @description Allows to specify fare basis code to be used in the search. */
            fareBasisCode?: components["schemas"]["FareBasisCode"];
        };
        /** @description Contains the results of a flight check, including any errors or warnings, as well as the validated flight, journey, tax, and offer details. */
        FlightCheckResponse: {
            /**
             * Format: date-time
             * @description The server timestamp when the response was generated.
             * @example 2019-09-09T09:09:09Z
             */
            timestamp: string;
            /** @description Lists detailed error information. For a successful response, this array isn't returned. */
            errors?: components["schemas"]["Error"][];
            /** @description Lists detailed warning information. */
            warnings?: components["schemas"]["Error"][];
            /** @description Lists flights. */
            flights?: components["schemas"]["Flight"][];
            /** @description Lists journeys. */
            journeys?: components["schemas"]["Journey"][];
            /** @description Lists tax or fee items. */
            taxItems?: components["schemas"]["TaxItem"][];
            /** @description Lists offers. */
            offers?: components["schemas"]["FlightCheckFlightOffer"][];
            /** @description Contains baggage and flexibility information associated to the search. */
            offerAttributes?: components["schemas"]["OfferAttributes"];
            /** @description Lists the results of offer validation, including booking class code validation and offer references. */
            offerValidationResults?: components["schemas"]["OfferValidationResults"][];
        };
        FlightCheckFareComponentSegmentDetail: components["schemas"]["FareComponentSegmentDetail"] & {
            /**
             * @description If `true`, there's an availability break between this segment and the next one, which may affect the validity of the offer.
             * @example false
             */
            availabilityBreak?: boolean;
        };
        FlightCheckFareComponent: components["schemas"]["FareComponent"] & {
            /** @description Lists segment details. */
            segmentDetails?: components["schemas"]["FlightCheckFareComponentSegmentDetail"][];
        };
        /** @description Contains a fare breakdown per traveler type. Multiple travelers of the same type are represented with a single `FlightCheckFareDetail` object. Travelers of different types require a separate `FlightCheckFareDetail` object per traveler type. */
        FlightCheckFareDetail: {
            /** @description Lists travelers the fare is associated with. */
            travelers: components["schemas"]["FlightCheckReturnedTraveler"][];
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
            fareComponents: components["schemas"]["FlightCheckFareComponent"][];
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
        /** @description Contains a traveler type for which a fare has been generated, along with the index of the passenger from the request. */
        FlightCheckReturnedTraveler: {
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
            requestedTravelerIndex?: number;
        };
        /** @description Contains an offer item that's not already included in the itinerary price. Can be either a flight (priced itinerary) or an ancillary. */
        FlightCheckFlightOfferItem: components["schemas"]["BaseOfferItemAttributes"] & {
            /** @description Lists fare details for a given flight offer. */
            fares: components["schemas"]["FlightCheckFareDetail"][];
            /**
             * @description If `true`, the offer item covers only a part of the trip for one-way or multi-ticket travel.
             * @default false
             */
            isPartial: boolean;
        };
        /** @description Contains an offer, which represents a purchasable flight travel package. */
        FlightCheckFlightOffer: components["schemas"]["BaseOfferAttributes"] & {
            /** @description Lists items within the offer that aren't already included in the itinerary price, which can be either a flight (priced itinerary) or an ancillary. */
            items?: components["schemas"]["FlightCheckFlightOfferItem"][];
            /**
             * Format: uuid
             * @description The ID of the refundability attribute associated with the offer.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            refundabilityRef?: string;
            /**
             * Format: uuid
             * @description The ID of the change attribute associated with the offer.
             * @example c693e9b2-1782-45f9-82f6-73f8cdd13cfa
             */
            changeRef?: string;
            /**
             * @description Lists the IDs of reference offers that are similar to the offer contained in this object.
             * @example [
             *       "123eww323"
             *     ]
             */
            additionalOffersRefs?: string[];
        };
        /**
         * @description Identifies whether the booking class codes in the itinerary are valid and match the requested fare basis.
         * @default Unknown
         * @example Matched
         * @enum {string}
         */
        BookingClassCodeValidationEnum: "Matched" | "Same cabin" | "None" | "Unknown";
        /** @description Contains the results of itinerary validation. */
        OfferValidationResults: {
            /** @description Identifies whether the booking class codes in the itinerary are valid and match the requested fare basis. */
            bookingClassCodeValidation: components["schemas"]["BookingClassCodeValidationEnum"];
            /**
             * @description The offer ID.
             * @example 123eww323
             */
            offerRef?: string;
        };
        /** @description Contains qualifier with fare basis codes preferences. */
        FareBasisCode: components["schemas"]["RequestedFareBasisCode"] | components["schemas"]["RequestedFareBasisCodePerJourney"];
        /** @description Contains preferred fare basis codes applied globally. */
        RequestedFareBasisCode: {
            /** @description Lists preferred fare basis codes. */
            values?: string[];
        };
        /** @description Contains preferred fare basis codes for each journey. */
        FareBasisCodePerJourneyPreferences: {
            /** @description Lists preferred fare basis codes. */
            values: string[];
            /** @description Lists the specific indices within the `journeys` array covered by the selected fare basis code. */
            journeyIndices: number[];
        };
        /** @description Contains preferred fare basis codes for each journey. */
        RequestedFareBasisCodePerJourney: {
            /** @description Lists preferred fare basis codes applicable to each journey in the itinerary. */
            preferences?: components["schemas"]["FareBasisCodePerJourneyPreferences"][];
        };
        /** @description Contains fare-related data for a specific flight segment. */
        Segment: {
            /**
             * @description The Reservation Booking Designator (booking code) applicable to the journey segment for which the fare was calculated.
             * @example E
             */
            bookingClassCode: string;
        };
        /** @description Contains a flight. */
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
            /** @description Contains fare-related details. */
            segmentDetails?: components["schemas"]["Segment"];
        };
        /** @description Contains a journey. */
        ItineraryJourney: {
            /** @description Lists flights within the journey. */
            flights: components["schemas"]["ItineraryFlight"][];
        };
        /** @description Contains a flight loyalty program. */
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
        /** @description Contains a traveler type (passenger type). */
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
            /** @description Lists airline loyalty programs applicable to the passenger. A passenger can have multiple frequent-flyer codes. Applicable only to NDC. */
            loyaltyPrograms?: components["schemas"]["LoyaltyProgram"][];
        };
        /**
         * @description Identifies a cabin processing logic. `Keep Same Cabin` is applicable only to ATPCO and NDC.
         * @default Avoid Cabin Downgrade - Main Flight
         * @example Jump Cabin
         * @enum {string}
         */
        CabinLogicEnum: "Jump Cabin" | "Keep Same Cabin" | "Avoid Cabin Downgrade - All Flights" | "Avoid Cabin Downgrade - Main Flight";
        /**
         * @description Identifies a cabin for which offers should be validated.
         * @example Economy
         * @enum {string}
         */
        CabinNameEnum: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy";
        /** @description Contains the preferred cabin type. */
        RequestedCabin: {
            /** @description Identifies which cabin processing logic applies. */
            logic?: components["schemas"]["CabinLogicEnum"];
            /** @description Identifies the aircraft cabin for which the API should validate offers. */
            name?: components["schemas"]["CabinNameEnum"];
        };
        /** @description Contains the preferred cabin type that the API applies to selected journeys. */
        CabinPerJourneyPreferences: {
            /** @description Identifies the aircraft cabin for which the API should validate offers. */
            name: components["schemas"]["CabinNameEnum"];
            /** @description Lists the indices of journeys within the `journeys` array to which the selected cabin type applies. */
            journeyIndices: number[];
        };
        /** @description Contains the preferred cabin type that the API applies per journey selection. */
        RequestedCabinPerJourney: {
            /** @description Identifies which cabin processing logic applies. */
            logic?: components["schemas"]["CabinLogicEnum"];
            /** @description Lists the preferred cabin types that can be selected within each journey. */
            preferences?: components["schemas"]["CabinPerJourneyPreferences"][];
        };
        /** @description Contains qualifiers with cabin preferences and cabin processing logic. */
        FareCabin: components["schemas"]["RequestedCabin"] | components["schemas"]["RequestedCabinPerJourney"];
        /**
         * @description Identifies a distribution model or systems or companies that host carrier APIs from which offers are expected.
         * @example ATPCO
         * @enum {string}
         */
        DistributionModelTypeEnum: "ATPCO" | "API" | "NDC";
        /**
         * @description Identifies the source of a code for which the traveler may have fares filed. Can be an ATPCO `Account Code`, a Sabre `Corporate Id`, or an NDC `Company Id`.
         * @default Account Code
         * @enum {string}
         */
        FareProgramTypeEnum: "Account Code" | "Corporate Id" | "Company Id";
        /** @description Contains a program used by agencies and airlines for fare filing purposes. These are usually private fares available to limited number of customers. */
        FareProgram: {
            /** @description Lists distribution models of the fare program. */
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
        /** @description Contains qualifiers which allow you to modify the offer price. */
        RequestedFare: {
            /**
             * @description The three-letter currency code in the ISO 4217 standard preferred for retrieving monetary values.
             * @example USD
             */
            currencyCode?: string;
            /** @description Contains the cabin name and cabin processing logic. */
            cabin?: components["schemas"]["FareCabin"];
            /**
             * @description If `true`, returns fares matching the requested passenger code for all fare components.
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
             * @description If `true`, returns an itemized breakdown of taxes and fees for each offer when available. A detailed tax and fee breakdown is only guaranteed for offers originating from the ATPCO distribution model and provided by Sabre. For other offers, this information may be unavailable and won't be returned if not supported by the source.
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
            /** @description Lists product characteristics that together form a unique airline offer. */
            returnOfferAttributes?: components["schemas"]["RetailingOfferAttributesEnum"][];
            /** @description Contains retailing attribute filters that you can use to refine a flight search. */
            filterByOfferAttributes?: components["schemas"]["RetailingOfferAttributesFilter"];
            /** @description Contains the number of additional offer solutions to return per journey. */
            returnAdditionalOffers?: components["schemas"]["ReturnAdditionalOffers"];
        };
        Error: {
            /**
             * @description A high-level grouping of errors indicating what kind of problem (client-side or server-side) occurred.
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
             * @description Additional information to help debug the error. For example, the name of a parameter missing from a request payload.
             * @example currencyCode
             */
            fieldName?: string;
            /**
             * @description Additional information to help debug the error. For example, the name of a parameter missing from a request payload.
             * @example currencyCode
             */
            fieldPath?: string;
            /**
             * @description The source of the error.
             * @example field value
             */
            fieldValue?: string;
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
        };
        /** @description Contains a portion of travel. A round trip consists of two journeys (for example, outbound and inbound). */
        Journey: {
            /**
             * Format: uuid
             * @description The ID of the journey.
             * @example ccc04ff0-d5ce-4314-9cbc-f01ec6bb91ab
             */
            id?: string;
            /** @description Lists flight IDs for the journey. */
            flightRefs?: string[];
            /**
             * Format: int32
             * @description The zero-based index of the journey from the request.
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
             * @description The IATA code of the airport where the tax is applicable.
             * @example CDG
             */
            airportCode?: string;
            /**
             * @description The ISO 3166 code of the country which levies the tax. Not applicable to carrier-imposed fees.
             * @example FR
             */
            taxCountry?: string;
        };
        /**
         * @description Identifies a data source provider from which offers are expected.
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
             * @description The data supplier ID.
             * @example Supplier identifier
             */
            supplier?: string;
            /** @description Identifies the data distribution model. */
            distributionModel?: components["schemas"]["DistributionModelTypeResponseEnum"];
            /** @description Identifies the data commercial model. */
            commercialModel?: components["schemas"]["CommercialModelTypeResponseEnum"];
        };
        /** @description Contains the total price of all offer items. */
        TotalPrice: {
            /**
             * Format: number
             * @description The total amount.
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
             * @description The exact point in time when this offer expires, expressed in UTC.
             * @example 2020-10-28T11:11:21.125Z
             */
            validUntil: string;
            /** @description Contains the origin of the offer. */
            source: components["schemas"]["Source"];
            /** @description Contains the total price of all mandatory offer items. */
            totalPrice: components["schemas"]["TotalPrice"];
            /**
             * Format: date-time
             * @description The date by which a commitment to pay for the confirmed items in the offer must be made.
             * @example 2020-10-28T11:11:21.125Z
             */
            paymentTimeLimit?: string;
            /** @description Lists PCCs the offer is applicable to. */
            applicableToPseudoCityCodes?: string[];
            /** @description Lists IDs of journeys the offer is applicable to. */
            journeyRefs?: string[];
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
        /** @description Contains the total price amount, including taxes and surcharges. */
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
             * @description The three-letter ISO 4217 currency code associated with the amounts.
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
         * @description Identifies a cabin for which offers should be validated.
         * @default Unknown
         * @example Economy
         * @enum {string}
         */
        CabinNameResponseEnum: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy" | "Unknown";
        /** @description Contains fare component details associated with a journey segment. */
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
            /** @description Identifies the cabin associated with the journey segment for which the fare was calculated. */
            cabinName?: components["schemas"]["CabinNameResponseEnum"];
            /**
             * Format: uuid
             * @description The ID of the baggage arrtibute associated with the fare component.
             * @example df58f912-7c38-416b-b97b-d73a8676f52c
             */
            checkedBaggageRef?: string;
            /**
             * Format: uuid
             * @description The ID of the baggage attribute associated with the fare component.
             * @example 75af09b1-ca5e-4b9b-a754-3297f516d147
             */
            carryOnBaggageRef?: string;
            /**
             * Format: int64
             * @description Carbon emissions of the fare cabin in grams per passenger.
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
             * @description The ID of the brand program.
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
             * @description The net fare component amount.
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
             * @description The published net fare component amount.
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
            /** @description Lists segment details associated with the fare component. */
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
             * @description The three-letter ISO 4217 currency code associated with the charge.
             * @example SGD
             */
            currencyCode: string;
        };
        /** @description Contains a baggage item that's included in a free baggage allowance or subject to baggage charges. */
        BaggageItemDefinition: {
            /**
             * Format: int32
             * @description Baggage weight in kilograms.
             * @example 23
             */
            weightInKilograms?: number;
            /**
             * Format: int32
             * @description Baggage weight in pounds.
             * @example 50
             */
            weightInPounds?: number;
            /**
             * Format: int32
             * @description Baggage size in inches.
             * @example 18
             */
            sizeInInches?: number;
            /**
             * Format: int32
             * @description Baggage size in centimeters.
             * @example 45
             */
            sizeInCentimeters?: number;
            /**
             * Format: int32
             * @description Baggage length in inches.
             * @example 18
             */
            lengthInInches?: number;
            /**
             * Format: int32
             * @description Baggage length in centimeters.
             * @example 45
             */
            lengthInCentimeters?: number;
            /**
             * Format: int32
             * @description Baggage height in inches.
             * @example 14
             */
            heightInInches?: number;
            /**
             * Format: int32
             * @description Baggage height in centimeters.
             * @example 35
             */
            heightInCentimeters?: number;
            /**
             * Format: int32
             * @description Baggage width in inches.
             * @example 8
             */
            widthInInches?: number;
            /**
             * Format: int32
             * @description Baggage width in centimeters.
             * @example 20
             */
            widthInCentimeters?: number;
            /** @description Lists descriptions of the baggage item in free-text format. */
            description?: string[];
        };
        /** @description Contains a baggage item that can be taken free of charge. */
        BaggageAllowances: {
            /**
             * Format: int32
             * @description The maximum number of pieces that are allowed free of charge.
             * @example 1
             */
            numberOfPieces?: number;
            /** @description Contains basic details of the baggage item. */
            bagDefinition?: components["schemas"]["BaggageItemDefinition"];
            /**
             * Format: int32
             * @description The maximum total baggage weight in kilograms if the carrier doesn't define the limit in terms of pieces.
             * @example 30
             */
            maximumWeightInKilograms?: number;
            /**
             * Format: int32
             * @description The maximum total baggage weight in pounds if the carrier doesn't define the limit in terms of pieces.
             * @example 30
             */
            maximumWeightInPounds?: number;
            /**
             * @description The IATA code of the airline whose baggage provisions apply.
             * @example AA
             */
            airlineCode?: string;
        };
        /** @description Contains a charge for baggage items that isn't part of a baggage allowance. */
        BaggageCharges: {
            /**
             * Format: int32
             * @description The start point of the inclusive `[firstPiece, lastPiece]` range for which the charge applies. The count starts from the item that exceeds the free baggage allowance.
             * @example 1
             */
            firstPiece?: number;
            /**
             * Format: int32
             * @description The end point of the inclusive `[firstPiece, lastPiece]` range for which the charge applies. The count starts from the item that exceeds the free baggage allowance.
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
             * @description The IATA code of the airline whose baggage provisions apply.
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
        /** @description Contains information about conditions of voluntary changes and refunds, as well as applicable fees. */
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
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    flightCheck: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Contains a flight offer to validate. Can be provided either as a full payload or as an `offerItemIDs` array. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["FlightCheckRequest"];
            };
        };
        responses: {
            /** @description Successful response, unless the `errors` array is returned. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FlightCheckResponse"];
                };
            };
        };
    };
}
