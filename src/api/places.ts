/**
 * Frontend API layer for Google Places integration
 * 
 * All Google Places API calls go through Supabase Edge Functions
 * to keep API keys secure and prevent quota theft.
 */

/**
 * Business data structure returned from API
 */
export interface Business {
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

/**
 * Search result with pagination support
 */
export interface SearchNearbyResult {
  businesses: Business[];
  nextPageToken?: string;
  scannedCount: number;
  returnedCount: number;
  filterNoWebsite: boolean;
  excludedByReviewsCount?: number;
  excludedByBlocklistCount?: number;
  excludedByTypeCount?: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Search for nearby businesses
 * 
 * @param location - Center location { lat, lng }
 * @param radiusMeters - Search radius in meters (e.g., 5000 for 5km)
 * @param filterNoWebsite - If true, return only businesses without a website
 * @param excludeLargeBusinesses - If true, filter out chains and large businesses
 * @param maxReviewCount - Maximum review count for small businesses
 * @param rankPreference - Sort by distance or prominence
 * @param chainBlocklist - Optional custom blocklist of chain names
 * @param category - Optional category filter ('all', 'restaurants', 'salons', etc.)
 * @param pageToken - Optional token to fetch next page (API will handle 2s delay)
 * @returns Businesses and optional nextPageToken for pagination
 */
export async function searchNearbyBusinesses(
  location: { lat: number; lng: number },
  radiusMeters: number,
  filterNoWebsite: boolean,
  excludeLargeBusinesses: boolean = true,
  maxReviewCount: number = 1000,
  rankPreference: 'distance' | 'prominence' = 'distance',
  chainBlocklist?: string[],
  category: string = 'all',
  pageToken?: string
): Promise<SearchNearbyResult> {
  const url = `${SUPABASE_URL}/functions/v1/search-nearby-businesses`;
  
  console.log('Calling edge function:', {
    url,
    location,
    radiusMeters,
    filterNoWebsite,
    excludeLargeBusinesses,
    maxReviewCount,
    rankPreference,
    category,
    isNextPage: !!pageToken,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        location,
        radiusMeters,
        filterNoWebsite,
        excludeLargeBusinesses,
        maxReviewCount,
        rankPreference,
        chainBlocklist,
        category,
        pageToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Edge function error:', errorData);
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    const data = await response.json() as SearchNearbyResult;
    
    console.log('Edge function response:', {
      scannedCount: data.scannedCount,
      returnedCount: data.returnedCount,
      filterNoWebsite: data.filterNoWebsite,
      excludedByReviews: data.excludedByReviewsCount || 0,
      excludedByBlocklist: data.excludedByBlocklistCount || 0,
      excludedByType: data.excludedByTypeCount || 0,
      hasNextPage: !!data.nextPageToken,
    });

    return data;
  } catch (error) {
    console.error('Error calling edge function:', error);
    throw error;
  }
}

/**
 * Client-side deduplication utility
 * Useful when merging results from multiple searches
 */
export function deduplicateBusinesses(businesses: Business[]): Business[] {
  const seen = new Set<string>();
  const deduplicated: Business[] = [];

  for (const business of businesses) {
    if (!seen.has(business.placeId)) {
      seen.add(business.placeId);
      deduplicated.push(business);
    }
  }

  if (businesses.length !== deduplicated.length) {
    console.log(`Client deduplication: ${businesses.length} -> ${deduplicated.length} businesses`);
  }

  return deduplicated;
}
