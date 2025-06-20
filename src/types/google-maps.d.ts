// Google Maps API TypeScript tanımları
declare global {
  interface Window {
    google: typeof google;
    googleMapsLoaded: boolean;
    initMap: () => void;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
      getZoom(): number;
      getBounds(): LatLngBounds | null;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | undefined;
      setTitle(title: string): void;
      setIcon(icon: string | symbol | Icon): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      close(): void;
      getContent(): string | Element;
      getPosition(): LatLng | undefined;
      getZIndex(): number;
      open(map?: Map, anchor?: MVCObject): void;
      setContent(content: string | Element): void;
      setOptions(options: InfoWindowOptions): void;
      setPosition(position: LatLng | LatLngLiteral): void;
      setZIndex(zIndex: number): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    class Geocoder {
      constructor();
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
      toString(): string;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      contains(latLng: LatLng): boolean;
      extend(point: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      intersects(other: LatLngBounds): boolean;
      isEmpty(): boolean;
      toJSON(): LatLngBoundsLiteral;
      toString(): string;
      union(other: LatLngBounds): LatLngBounds;
    }

    interface MapOptions {
      zoom?: number;
      center?: LatLng | LatLngLiteral;
      mapTypeId?: MapTypeId;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      mapTypeControl?: boolean;
      gestureHandling?: GestureHandlingOptions;
      restriction?: MapRestriction;
      styles?: MapTypeStyle[];
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | symbol | Icon;
      draggable?: boolean;
      clickable?: boolean;
      cursor?: string;
      crossOnDrag?: boolean;
      optimized?: boolean;
      visible?: boolean;
      zIndex?: number;
    }

    interface InfoWindowOptions {
      content?: string | Element;
      position?: LatLng | LatLngLiteral;
      pixelOffset?: Size;
      maxWidth?: number;
      disableAutoPan?: boolean;
      zIndex?: number;
    }

    interface GeocoderRequest {
      location?: LatLng | LatLngLiteral;
      placeId?: string;
      address?: string;
      bounds?: LatLngBounds;
      componentRestrictions?: GeocoderComponentRestrictions;
      region?: string;
    }

    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: GeocoderGeometry;
      place_id: string;
      types: string[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderGeometry {
      bounds?: LatLngBounds;
      location: LatLng;
      location_type: GeocoderLocationType;
      viewport: LatLngBounds;
    }

    interface GeocoderComponentRestrictions {
      administrativeArea?: string;
      country?: string | string[];
      locality?: string;
      postalCode?: string;
      route?: string;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    interface Size {
      width: number;
      height: number;
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string): Size;
    }

    interface Icon {
      url: string;
      anchor?: Point;
      labelOrigin?: Point;
      origin?: Point;
      scaledSize?: Size;
      size?: Size;
    }

    interface Point {
      x: number;
      y: number;
      constructor(x: number, y: number): Point;
    }

    interface MapTypeStyle {
      elementType?: string;
      featureType?: string;
      stylers: MapTypeStyler[];
    }

    interface MapTypeStyler {
      color?: string;
      gamma?: number;
      hue?: string;
      invert_lightness?: boolean;
      lightness?: number;
      saturation?: number;
      visibility?: string;
      weight?: number;
    }

    interface MapRestriction {
      latLngBounds: LatLngBounds | LatLngBoundsLiteral;
      strictBounds?: boolean;
    }

    interface MVCObject {
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      bindTo(key: string, target: MVCObject, targetKey?: string, noNotify?: boolean): void;
      get(key: string): any;
      notify(key: string): void;
      set(key: string, value: any): void;
      setValues(values: any): void;
      unbind(key: string): void;
      unbindAll(): void;
    }

    interface MapsEventListener {
      remove(): void;
    }

    type MapTypeId = 'hybrid' | 'roadmap' | 'satellite' | 'terrain';
    type GestureHandlingOptions = 'cooperative' | 'greedy' | 'none' | 'auto';
    
    enum GeocoderStatus {
      ERROR = 'ERROR',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OK = 'OK',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      ZERO_RESULTS = 'ZERO_RESULTS'
    }

    enum GeocoderLocationType {
      APPROXIMATE = 'APPROXIMATE',
      GEOMETRIC_CENTER = 'GEOMETRIC_CENTER',
      RANGE_INTERPOLATED = 'RANGE_INTERPOLATED',
      ROOFTOP = 'ROOFTOP'
    }

    namespace event {
      function addListener(instance: object, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
      function clearListeners(instance: object, eventName: string): void;
      function trigger(instance: object, eventName: string, ...args: any[]): void;
    }

    namespace places {
      class PlacesService {
        constructor(map: Map | HTMLDivElement);
        findPlaceFromQuery(
          request: FindPlaceFromQueryRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
        findPlaceFromPhoneNumber(
          request: FindPlaceFromPhoneNumberRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
        getDetails(
          request: PlaceDetailsRequest,
          callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
        nearbySearch(
          request: PlaceSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
        textSearch(
          request: TextSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
        getQueryPredictions(
          request: QueryAutocompletionRequest,
          callback: (predictions: QueryAutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class Autocomplete extends MVCObject {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions);
        getBounds(): LatLngBounds | undefined;
        getFields(): string[] | undefined;
        getPlace(): PlaceResult;
        setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
        setComponentRestrictions(restrictions: ComponentRestrictions): void;
        setFields(fields: string[]): void;
        setOptions(options: AutocompleteOptions): void;
        setTypes(types: string[]): void;
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        componentRestrictions?: ComponentRestrictions;
        fields?: string[];
        strictBounds?: boolean;
        types?: string[];
      }

      interface ComponentRestrictions {
        country: string | string[];
      }

      interface FindPlaceFromQueryRequest {
        query: string;
        fields: string[];
        locationBias?: LocationBias;
        language?: string;
      }

      interface FindPlaceFromPhoneNumberRequest {
        phoneNumber: string;
        fields: string[];
        locationBias?: LocationBias;
        language?: string;
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
        language?: string;
        region?: string;
        sessionToken?: AutocompleteSessionToken;
      }

      interface PlaceSearchRequest {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        keyword?: string;
        language?: string;
        location?: LatLng | LatLngLiteral;
        maxPriceLevel?: number;
        minPriceLevel?: number;
        name?: string;
        openNow?: boolean;
        radius?: number;
        rankBy?: RankBy;
        type?: string;
        types?: string[];
      }

      interface TextSearchRequest {
        query: string;
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        language?: string;
        location?: LatLng | LatLngLiteral;
        radius?: number;
        region?: string;
        type?: string;
        types?: string[];
      }

      interface AutocompletionRequest {
        input: string;
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        componentRestrictions?: ComponentRestrictions;
        location?: LatLng;
        offset?: number;
        origin?: LatLng | LatLngLiteral;
        radius?: number;
        region?: string;
        sessionToken?: AutocompleteSessionToken;
        types?: string[];
      }

      interface QueryAutocompletionRequest {
        input: string;
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        location?: LatLng;
        offset?: number;
        radius?: number;
      }

      interface PlaceResult {
        address_components?: GeocoderAddressComponent[];
        adr_address?: string;
        business_status?: BusinessStatus;
        formatted_address?: string;
        formatted_phone_number?: string;
        geometry?: PlaceGeometry;
        html_attributions?: string[];
        icon?: string;
        icon_background_color?: string;
        icon_mask_base_uri?: string;
        international_phone_number?: string;
        name?: string;
        opening_hours?: PlaceOpeningHours;
        permanently_closed?: boolean;
        photos?: PlacePhoto[];
        place_id?: string;
        plus_code?: PlacePlusCode;
        price_level?: number;
        rating?: number;
        reviews?: PlaceReview[];
        types?: string[];
        url?: string;
        user_ratings_total?: number;
        utc_offset_minutes?: number;
        vicinity?: string;
        website?: string;
      }

      interface PlaceGeometry {
        location?: LatLng;
        viewport?: LatLngBounds;
      }

      interface PlaceOpeningHours {
        open_now?: boolean;
        periods?: PlaceOpeningHoursPeriod[];
        weekday_text?: string[];
      }

      interface PlaceOpeningHoursPeriod {
        close?: PlaceOpeningHoursTime;
        open: PlaceOpeningHoursTime;
      }

      interface PlaceOpeningHoursTime {
        day: number;
        time: string;
        hours?: number;
        minutes?: number;
        nextDate?: number;
      }

      interface PlacePhoto {
        height: number;
        html_attributions: string[];
        width: number;
        getUrl(opts?: PhotoOptions): string;
      }

      interface PhotoOptions {
        maxHeight?: number;
        maxWidth?: number;
      }

      interface PlacePlusCode {
        compound_code?: string;
        global_code: string;
      }

      interface PlaceReview {
        aspects?: PlaceAspectRating[];
        author_name: string;
        author_url?: string;
        language: string;
        profile_photo_url: string;
        rating: number;
        relative_time_description: string;
        text: string;
        time: number;
      }

      interface PlaceAspectRating {
        rating: number;
        type: string;
      }

      interface AutocompletePrediction {
        description: string;
        distance_meters?: number;
        matched_substrings: PredictionSubstring[];
        place_id: string;
        reference: string;
        structured_formatting: AutocompleteStructuredFormatting;
        terms: PredictionTerm[];
        types: string[];
      }

      interface QueryAutocompletePrediction {
        description: string;
        matched_substrings: PredictionSubstring[];
        place_id?: string;
        terms: PredictionTerm[];
      }

      interface PredictionSubstring {
        length: number;
        offset: number;
      }

      interface PredictionTerm {
        offset: number;
        value: string;
      }

      interface AutocompleteStructuredFormatting {
        main_text: string;
        main_text_matched_substrings?: PredictionSubstring[];
        secondary_text?: string;
        secondary_text_matched_substrings?: PredictionSubstring[];
      }

      class AutocompleteSessionToken {}

      type LocationBias = 
        | LatLng 
        | LatLngLiteral 
        | LatLngBounds 
        | LatLngBoundsLiteral 
        | Circle 
        | CircleLiteral
        | string;

      interface Circle {
        center: LatLng | LatLngLiteral;
        radius: number;
      }

      interface CircleLiteral {
        center: LatLng | LatLngLiteral;
        radius: number;
      }

      enum BusinessStatus {
        CLOSED_PERMANENTLY = 'CLOSED_PERMANENTLY',
        CLOSED_TEMPORARILY = 'CLOSED_TEMPORARILY',
        OPERATIONAL = 'OPERATIONAL'
      }

      enum PlacesServiceStatus {
        INVALID_REQUEST = 'INVALID_REQUEST',
        NOT_FOUND = 'NOT_FOUND',
        OK = 'OK',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        ZERO_RESULTS = 'ZERO_RESULTS'
      }

      enum RankBy {
        DISTANCE = 0,
        PROMINENCE = 1
      }
    }

    namespace geometry {
      namespace spherical {
        function computeDistanceBetween(from: LatLng, to: LatLng, radius?: number): number;
        function computeHeading(from: LatLng, to: LatLng): number;
        function computeLength(path: LatLng[], radius?: number): number;
        function computeOffset(from: LatLng, distance: number, heading: number, radius?: number): LatLng;
        function computeOffsetOrigin(to: LatLng, distance: number, heading: number, radius?: number): LatLng;
        function computeSignedArea(loop: LatLng[], radius?: number): number;
        function interpolate(from: LatLng, to: LatLng, fraction: number): LatLng;
      }
    }
  }
}

export {}; 