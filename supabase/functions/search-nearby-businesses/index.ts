/**
 * Supabase Edge Function: search-nearby-businesses
 * 
 * Searches for nearby businesses using Google Places API.
 * Handles pagination, deduplication, and normalization.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Type definitions for Google Places API (New REST API)
interface PlacesApiResponse {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
}

interface PlacesApiPlace {
  id: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

interface Business {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  types: string[];
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
}

interface SearchNearbyResult {
  businesses: Business[];
  nextPageToken?: string;
  scannedCount: number;
  returnedCount: number;
  filterNoWebsite: boolean;
  excludedByReviewsCount?: number;
  excludedByBlocklistCount?: number;
  excludedByTypeCount?: number;
}

/**
 * Target business types - small local businesses that are good prospects for web development
 * Using only valid Place Types from: https://developers.google.com/maps/documentation/places/web-service/place-types
 */
const ALL_BUSINESS_TYPES = [
  'accounting',
  'bakery',
  'bar',
  'beauty_salon',
  'bicycle_store',
  'book_store',
  'cafe',
  'car_repair',
  'car_wash',
  'clothing_store',
  'convenience_store',
  'dentist',
  'doctor',
  'electrician',
  'electronics_store',
  'florist',
  'furniture_store',
  'gym',
  'hair_care',
  'hardware_store',
  'home_goods_store',
  'insurance_agency',
  'jewelry_store',
  'laundry',
  'lawyer',
  'locksmith',
  'lodging',
  'meal_delivery',
  'meal_takeaway',
  'moving_company',
  'night_club',
  'painter',
  'pet_store',
  'pharmacy',
  'physiotherapist',
  'plumber',
  'real_estate_agency',
  'restaurant',
  'roofing_contractor',
  'shoe_store',
  'shopping_mall',
  'spa',
  'storage',
  'supermarket',
  'travel_agency',
  'veterinary_care',
  'school',
  'secondary_school',
  'car_dealer',
];

/**
 * Category-to-Google-Place-Types mapping
 */
const CATEGORY_TYPE_MAP: Record<string, string[]> = {
  all: ALL_BUSINESS_TYPES,
  restaurants: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_delivery', 'meal_takeaway', 'night_club'],
  salons: ['beauty_salon', 'hair_care', 'spa'],
  contractors: ['electrician', 'plumber', 'painter', 'roofing_contractor', 'locksmith', 'moving_company'],
  dental: ['dentist'],
  fitness: ['gym'],
  retail: [
    'clothing_store',
    'shoe_store',
    'jewelry_store',
    'book_store',
    'electronics_store',
    'furniture_store',
    'hardware_store',
    'home_goods_store',
    'pet_store',
    'bicycle_store',
    'florist',
    'convenience_store',
  ],
  automotive: ['car_repair', 'car_wash', 'car_dealer'],
  professional: ['accounting', 'lawyer', 'insurance_agency', 'real_estate_agency', 'travel_agency'],
  health: ['doctor', 'pharmacy', 'physiotherapist', 'veterinary_care'],
};

/**
 * Default chain blocklist - well-known chains and franchises
 */
const DEFAULT_CHAIN_BLOCKLIST = [
  'nordstrom',
  'macy',
  'target',
  'walmart',
  'costco',
  'starbucks',
  'mcdonald',
  'burger king',
  'wendy',
  'taco bell',
  'subway',
  'chipotle',
  'panera',
  'chick-fil-a',
  'popeyes',
  'kfc',
  'pizza hut',
  'domino',
  'papa john',
  'olive garden',
  'applebee',
  'chili',
  'red lobster',
  'outback',
  'buffalo wild wings',
  'dave\'s hot chicken',
  'the cheesecake factory',
  'pf chang',
  'california pizza kitchen',
  'shake shack',
  'five guys',
  'in-n-out',
  'panda express',
  'jamba juice',
  'smoothie king',
  'cvs',
  'walgreens',
  'rite aid',
  'whole foods',
  '7-eleven',
  'shell',
  'chevron',
  'exxon',
  'bp',
  'arco',
];

/**
 * Types that indicate large businesses/chains
 */
const LARGE_BUSINESS_TYPES = [
  'department_store',
  'shopping_mall',
  'supermarket',
];

/**
 * Deduplicate businesses by placeId
 */
function deduplicateBusinesses(businesses: Business[]): Business[] {
  const seen = new Set<string>();
  const deduplicated: Business[] = [];

  for (const business of businesses) {
    if (!seen.has(business.placeId)) {
      seen.add(business.placeId);
      deduplicated.push(business);
    }
  }

  console.log(`Deduplication: ${businesses.length} -> ${deduplicated.length} businesses`);
  return deduplicated;
}

/**
 * Search for nearby businesses using Google Places API
 */
async function searchNearbyBusinesses(
  lat: number,
  lng: number,
  radiusMeters: number,
  filterNoWebsite: boolean,
  excludeLargeBusinesses: boolean,
  maxReviewCount: number,
  rankPreference: 'distance' | 'prominence',
  chainBlocklist: string[],
  category: string = 'all',
  pageToken?: string
): Promise<SearchNearbyResult> {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable not configured');
  }

  // Get business types for the selected category
  const targetTypes = CATEGORY_TYPE_MAP[category] || CATEGORY_TYPE_MAP.all;

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  
  // Build request body - when using pageToken, only send the token
  const requestBody: Record<string, unknown> = pageToken
    ? { pageToken }
    : {
        includedTypes: targetTypes,
        maxResultCount: 20, // API maximum per request
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: radiusMeters,
          },
        },
        rankPreference, // Use distance to avoid "famous places" bias
      };

  console.log('Google Places API request:', {
    url,
    lat,
    lng,
    radiusMeters,
    category,
    targetTypesCount: targetTypes.length,
    isNextPage: !!pageToken,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id,places.types,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Places API error:', errorText);
    throw new Error(`Places API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as PlacesApiResponse;
  
  console.log('Google Places API response:', {
    placesCount: data.places?.length || 0,
    hasNextPage: !!data.nextPageToken,
  });

  if (!data.places || data.places.length === 0) {
    return { 
      businesses: [], 
      nextPageToken: data.nextPageToken,
      scannedCount: 0,
      returnedCount: 0,
      filterNoWebsite,
      excludedByReviewsCount: 0,
      excludedByBlocklistCount: 0,
      excludedByTypeCount: 0,
    };
  }

  // Transform API response to our Business interface
  const businesses: Business[] = data.places.map((place) => {
    // Normalize website - treat null, undefined, empty string, or whitespace as "no website"
    let website = place.websiteUri || '';
    website = website.trim();
    
    return {
      placeId: place.id,
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
      types: place.types || [],
      rating: place.rating,
      reviewCount: place.userRatingCount,
      phone: place.nationalPhoneNumber,
      website: website || undefined, // Convert empty string to undefined
    };
  });

  // Log statistics
  const withWebsite = businesses.filter(b => b.website).length;
  const withoutWebsite = businesses.filter(b => !b.website).length;
  console.log(`Website status: ${withWebsite} with website, ${withoutWebsite} without website`);

  // Deduplicate results
  const deduplicated = deduplicateBusinesses(businesses);
  const scannedCount = deduplicated.length;

  // Apply large business filtering if enabled
  let excludedByReviewsCount = 0;
  let excludedByBlocklistCount = 0;
  let excludedByTypeCount = 0;
  let filtered = deduplicated;

  if (excludeLargeBusinesses) {
    // Filter by review count
    const beforeReviewFilter = filtered.length;
    filtered = filtered.filter(b => !b.reviewCount || b.reviewCount < maxReviewCount);
    excludedByReviewsCount = beforeReviewFilter - filtered.length;
    
    // Filter by chain blocklist (case-insensitive contains match)
    const beforeBlocklistFilter = filtered.length;
    filtered = filtered.filter(b => {
      const nameLower = b.name.toLowerCase();
      return !chainBlocklist.some(chain => nameLower.includes(chain.toLowerCase()));
    });
    excludedByBlocklistCount = beforeBlocklistFilter - filtered.length;
    
    // Filter by large business types
    const beforeTypeFilter = filtered.length;
    filtered = filtered.filter(b => {
      return !b.types.some(type => LARGE_BUSINESS_TYPES.includes(type));
    });
    excludedByTypeCount = beforeTypeFilter - filtered.length;
    
    console.log(`Large business filtering: excluded ${excludedByReviewsCount} by reviews, ${excludedByBlocklistCount} by blocklist, ${excludedByTypeCount} by type`);
  }

  // Apply filterNoWebsite AFTER large business filtering
  if (filterNoWebsite) {
    const beforeWebsiteFilter = filtered.length;
    filtered = filtered.filter(b => !b.website);
    console.log(`Filtering businesses without website: ${beforeWebsiteFilter} -> ${filtered.length}`);
  }

  // Sort by review count ascending (smaller businesses first), then by distance
  filtered.sort((a, b) => {
    const reviewDiff = (a.reviewCount || 0) - (b.reviewCount || 0);
    if (reviewDiff !== 0) return reviewDiff;
    // Distance would require calculating from center - for now just use review count
    return 0;
  });

  const returnedCount = filtered.length;

  console.log(`Search results: scannedCount=${scannedCount}, returnedCount=${returnedCount}, filterNoWebsite=${filterNoWebsite}, excludeLargeBusinesses=${excludeLargeBusinesses}, hasNextPage=${!!data.nextPageToken}`);

  return {
    businesses: filtered,
    nextPageToken: data.nextPageToken,
    scannedCount,
    returnedCount,
    filterNoWebsite,
    excludedByReviewsCount,
    excludedByBlocklistCount,
    excludedByTypeCount,
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      location, 
      radiusMeters, 
      pageToken, 
      filterNoWebsite = false,
      excludeLargeBusinesses = true,
      maxReviewCount = 1000,
      rankPreference = 'distance',
      chainBlocklist,
      category = 'all',
    } = await req.json();

    // Validate required parameters
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return new Response(
        JSON.stringify({ error: 'location with lat and lng is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof radiusMeters !== 'number' || radiusMeters <= 0) {
      return new Response(
        JSON.stringify({ error: 'radiusMeters must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided blocklist or default
    const blocklist = chainBlocklist || DEFAULT_CHAIN_BLOCKLIST;

    // If pageToken is provided, wait 2 seconds (Google requirement)
    if (pageToken) {
      console.log('Waiting 2 seconds before using pageToken...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const result = await searchNearbyBusinesses(
      location.lat,
      location.lng,
      radiusMeters,
      filterNoWebsite,
      excludeLargeBusinesses,
      maxReviewCount,
      rankPreference as 'distance' | 'prominence',
      blocklist,
      category,
      pageToken
    );

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in search-nearby-businesses:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
