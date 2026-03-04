/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';
import { googlePlacesConfig } from '@/lib/googlePlaces';

interface LocationAutocompleteProps {
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onLocationChange?: (location: {
    address: string;
    lat: number;
    lng: number;
    placeId?: string;
  }) => void;
}

// Track if Google Places API has been initialized globally
let isGooglePlacesInitialized = false;

export default function LocationAutocomplete({
  id,
  defaultValue = 'Seattle, WA',
  placeholder = 'City, State or ZIP',
  className,
  onLocationChange,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check API key configuration on mount
  const isConfigured = googlePlacesConfig.isConfigured;

  useEffect(() => {
    // Skip if API key is not configured
    if (!isConfigured) {
      return;
    }

    // Initialize Google Places API only once globally
    if (!isGooglePlacesInitialized) {
      setOptions({
        key: googlePlacesConfig.apiKey,
        v: googlePlacesConfig.version,
        // Cast readonly array to mutable array for API compatibility
        libraries: [...googlePlacesConfig.libraries],
      });
      isGooglePlacesInitialized = true;
    }

    importLibrary('places')
      .then((placesLibrary) => {
        if (!inputRef.current) return;

        // Create autocomplete instance
        autocompleteRef.current = new placesLibrary.Autocomplete(
          inputRef.current,
          googlePlacesConfig.autocompleteOptions
        );

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();

          if (!place?.geometry?.location) {
            setError('Please select a valid location from the dropdown');
            return;
          }

          setError(null);

          // Extract location data
          const locationData = {
            address: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id,
          };

          onLocationChange?.(locationData);
        });

        setIsLoaded(true);
      })
      .catch((err: Error) => {
        console.error('Error loading Google Places API:', err);
        setError('Failed to load location services. Using fallback input.');
      });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationChange, isConfigured]);

  // Fallback: if API key is not set or loading failed
  if (!isConfigured || error) {
    return (
      <div>
        <Input
          ref={inputRef}
          id={id}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(className)}
        />
        {!isConfigured && (
          <p className="text-xs text-muted-foreground mt-1">
            ⚠️ Configure Google Places API key in your .env file (VITE_GOOGLE_PLACES_API_KEY)
          </p>
        )}
        {error && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Input
        ref={inputRef}
        id={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(className)}
      />
      {!isLoaded && (
        <p className="text-xs text-muted-foreground mt-1">
          Loading location services...
        </p>
      )}
    </div>
  );
}