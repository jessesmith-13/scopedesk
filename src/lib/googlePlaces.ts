/**
 * Google Places API integration
 * Get your API key from: https://console.cloud.google.com/google/maps-apis
 * 
 * Setup Instructions:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a new project or select existing
 * 3. Enable "Places API" and "Geocoding API"
 * 4. Create credentials -> API Key
 * 5. Restrict your API key:
 *    - Application restrictions: HTTP referrers (your domain)
 *    - API restrictions: Places API, Geocoding API
 * 6. Add VITE_GOOGLE_PLACES_API_KEY to your .env file
 */

// Get API key from environment variables
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY' || apiKey.includes('placeholder')) {
    // Only warn once in development
    if (import.meta.env.DEV && apiKey && !apiKey.includes('placeholder')) {
      console.warn(
        'Google Places API key not configured. ' +
        'Add VITE_GOOGLE_PLACES_API_KEY to your .env file.'
      );
    }
    return '';
  }
  
  return apiKey;
};

export const googlePlacesConfig = {
  // API key from environment variables
  get apiKey() {
    return getApiKey();
  },
  
  // API configuration
  version: 'weekly' as const,
  libraries: ['places'] as const,
  
  // Autocomplete options for location search
  autocompleteOptions: {
    types: ['(cities)', 'postal_code'],
    componentRestrictions: { country: 'us' },
    fields: ['address_components', 'geometry', 'formatted_address', 'place_id'],
  },
  
  // Check if API is configured
  get isConfigured() {
    return Boolean(getApiKey());
  },
};

// Type definitions for Google Places API responses
export interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface PlacesAutocompleteService {
  getPlacePredictions(
    request: {
      input: string;
      types?: string[];
      componentRestrictions?: { country: string };
    },
    callback: (
      predictions: Array<{
        description: string;
        place_id: string;
      }> | null,
      status: string
    ) => void
  ): void;
}

/**
 * Load Google Places API script dynamically
 */
export const loadGooglePlacesScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!googlePlacesConfig.isConfigured) {
      reject(new Error('Google Places API key not configured'));
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => 
        reject(new Error('Failed to load Google Places script'))
      );
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googlePlacesConfig.apiKey}&libraries=places&v=${googlePlacesConfig.version}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Places script'));

    document.head.appendChild(script);
  });
};

/**
 * Search for places using Google Places API
 */
export const searchPlaces = async (
  query: string,
  options?: {
    types?: string[];
    location?: { lat: number; lng: number };
    radius?: number;
  }
): Promise<PlaceResult[]> => {
  if (!googlePlacesConfig.isConfigured) {
    throw new Error('Google Places API key not configured');
  }

  await loadGooglePlacesScript();

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    const request: google.maps.places.TextSearchRequest = {
      query,
      ...(options?.location && {
        location: new window.google.maps.LatLng(
          options.location.lat,
          options.location.lng
        ),
      }),
      ...(options?.radius && { radius: options.radius }),
    };

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results as PlaceResult[]);
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
};

/**
 * Get place details by place ID
 */
export const getPlaceDetails = async (
  placeId: string
): Promise<PlaceResult> => {
  if (!googlePlacesConfig.isConfigured) {
    throw new Error('Google Places API key not configured');
  }

  await loadGooglePlacesScript();

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    service.getDetails(
      {
        placeId,
        fields: [
          'place_id',
          'formatted_address',
          'geometry',
          'address_components',
          'name',
          'formatted_phone_number',
          'website',
        ],
      },
      (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
          resolve(result as PlaceResult);
        } else {
          reject(new Error(`Get place details failed: ${status}`));
        }
      }
    );
  });
};

// Extend window type for Google Maps
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          PlacesService: new (element: HTMLElement) => {
            textSearch: (
              request: google.maps.places.TextSearchRequest,
              callback: (
                results: google.maps.places.PlaceResult[] | null,
                status: google.maps.places.PlacesServiceStatus
              ) => void
            ) => void;
            getDetails: (
              request: google.maps.places.PlaceDetailsRequest,
              callback: (
                result: google.maps.places.PlaceResult | null,
                status: google.maps.places.PlacesServiceStatus
              ) => void
            ) => void;
          };
          PlacesServiceStatus: typeof google.maps.places.PlacesServiceStatus;
        };
        LatLng: typeof google.maps.LatLng;
      };
    };
  }
}