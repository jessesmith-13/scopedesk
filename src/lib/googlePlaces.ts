/**
 * Google Places API integration (Frontend - Autocomplete Only)
 * 
 * This module ONLY handles location autocomplete for the UI.
 * All business search functionality goes through /src/api/places.ts → Edge Functions.
 * 
 * Setup Instructions:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a new project or select existing
 * 3. Enable "Places API" and "Geocoding API"
 * 4. Create credentials -> API Key
 * 5. For location autocomplete, add VITE_GOOGLE_PLACES_API_KEY to .env file
 * 6. For business search, add GOOGLE_PLACES_API_KEY to Supabase Edge Function environment
 */

// Get API key from environment variables (only used for location autocomplete)
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY' || apiKey.includes('placeholder')) {
    return '';
  }
  
  return apiKey;
};

export const googlePlacesConfig = {
  // API key from environment variables (only for autocomplete)
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
 * Load Google Places API script dynamically (only for autocomplete)
 */
export const loadGooglePlacesScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      reject(new Error('Google Places API key not configured for autocomplete'));
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=${googlePlacesConfig.version}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Places script'));

    document.head.appendChild(script);
  });
};

/**
 * Get place details by place ID (for autocomplete only)
 */
export const getPlaceDetails = async (
  placeId: string
): Promise<PlaceResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
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
