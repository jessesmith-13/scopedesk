// Overpass API Service for querying OpenStreetMap data
// Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API

export const OVERPASS_CONFIG = {
  // Public Overpass API endpoint (no API key required)
  apiUrl: 'https://overpass-api.de/api/interpreter',
  
  // Rate limiting: Max 2 requests per second
  // For production, consider running your own Overpass instance
  timeout: 25, // seconds
};

export interface OverpassQueryParams {
  lat: number;
  lng: number;
  radiusMiles: number;
  categories?: string[];
  excludeChains?: boolean;
}

export interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    phone?: string;
    website?: string;
    shop?: string;
    amenity?: string;
    craft?: string;
    office?: string;
    healthcare?: string;
    leisure?: string;
    [key: string]: string | undefined;
  };
}

export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassNode[];
}

/**
 * Build an Overpass QL query for finding local businesses
 */
export function buildOverpassQuery({
  lat,
  lng,
  radiusMiles,
  categories = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  excludeChains = true, // TODO: Implement chain filtering logic
}: OverpassQueryParams): string {
  const radiusMeters = Math.round(radiusMiles * 1609.34);

  // Build category filters
  const categoryFilters = categories.length > 0
    ? categories.map(cat => getCategoryFilter(cat, radiusMeters, lat, lng)).join('')
    : getAllBusinessFilters(radiusMeters, lat, lng);

  return `
[out:json][timeout:${OVERPASS_CONFIG.timeout}];
(
  ${categoryFilters}
);
out body;
>;
out skel qt;
  `.trim().replace(/\\s+/g, ' ').replace(/\\n/g, '');
}

function getCategoryFilter(category: string, radiusMeters: number, lat: number, lng: number): string {
  const filters: Record<string, string> = {
    'restaurants': `node(around:${radiusMeters},${lat},${lng})["amenity"="restaurant"];node(around:${radiusMeters},${lat},${lng})["amenity"="cafe"];`,
    'salons': `node(around:${radiusMeters},${lat},${lng})["shop"="hairdresser"];node(around:${radiusMeters},${lat},${lng})["shop"="beauty"];node(around:${radiusMeters},${lat},${lng})["leisure"="spa"];`,
    'contractors': `node(around:${radiusMeters},${lat},${lng})["craft"="carpenter"];node(around:${radiusMeters},${lat},${lng})["craft"="plumber"];node(around:${radiusMeters},${lat},${lng})["craft"="electrician"];node(around:${radiusMeters},${lat},${lng})["craft"="painter"];node(around:${radiusMeters},${lat},${lng})["craft"="roofer"];`,
    'dental': `node(around:${radiusMeters},${lat},${lng})["amenity"="dentist"];`,
    'fitness': `node(around:${radiusMeters},${lat},${lng})["leisure"="fitness_centre"];node(around:${radiusMeters},${lat},${lng})["sport"="fitness"];`,
    'retail': `node(around:${radiusMeters},${lat},${lng})["shop"];`,
    'automotive': `node(around:${radiusMeters},${lat},${lng})["shop"="car_repair"];node(around:${radiusMeters},${lat},${lng})["amenity"="car_wash"];node(around:${radiusMeters},${lat},${lng})["shop"="car"];`,
    'professional': `node(around:${radiusMeters},${lat},${lng})["office"="lawyer"];node(around:${radiusMeters},${lat},${lng})["office"="accountant"];node(around:${radiusMeters},${lat},${lng})["office"="insurance"];node(around:${radiusMeters},${lat},${lng})["office"="estate_agent"];`,
    'health': `node(around:${radiusMeters},${lat},${lng})["amenity"="doctors"];node(around:${radiusMeters},${lat},${lng})["amenity"="pharmacy"];node(around:${radiusMeters},${lat},${lng})["amenity"="veterinary"];node(around:${radiusMeters},${lat},${lng})["healthcare"="physiotherapist"];`,
  };
  return filters[category] || '';
}

function getAllBusinessFilters(radiusMeters: number, lat: number, lng: number): string {
  return `
    node(around:${radiusMeters},${lat},${lng})["shop"];
    node(around:${radiusMeters},${lat},${lng})["amenity"~"restaurant|cafe|bar|dentist|veterinary|doctors|pharmacy|car_wash"];
    node(around:${radiusMeters},${lat},${lng})["craft"];
    node(around:${radiusMeters},${lat},${lng})["office"~"lawyer|accountant|insurance|estate_agent"];
    node(around:${radiusMeters},${lat},${lng})["leisure"="fitness_centre"];
    node(around:${radiusMeters},${lat},${lng})["healthcare"="physiotherapist"];
  `;
}

/**
 * Fetch businesses from Overpass API
 */
export async function fetchBusinesses(params: OverpassQueryParams): Promise<OverpassResponse> {
  const query = buildOverpassQuery(params);
  
  try {
    const response = await fetch(OVERPASS_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data: OverpassResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from Overpass API:', error);
    throw error;
  }
}

/**
 * Convert Overpass node to a formatted address string
 */
export function formatAddress(node: OverpassNode): string {
  const parts: string[] = [];
  
  if (node.tags['addr:housenumber']) parts.push(node.tags['addr:housenumber']);
  if (node.tags['addr:street']) parts.push(node.tags['addr:street']);
  
  const cityParts: string[] = [];
  if (node.tags['addr:city']) cityParts.push(node.tags['addr:city']);
  if (node.tags['addr:state']) cityParts.push(node.tags['addr:state']);
  if (node.tags['addr:postcode']) cityParts.push(node.tags['addr:postcode']);
  
  if (cityParts.length > 0) parts.push(cityParts.join(', '));
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

/**
 * Determine business category from OSM tags
 */
export function getBusinessCategory(node: OverpassNode): string {
  const tags = node.tags;
  
  // Prioritize specific tags
  if (tags.amenity === 'restaurant') return 'Restaurant';
  if (tags.amenity === 'cafe') return 'Cafe';
  if (tags.amenity === 'bar') return 'Bar';
  if (tags.amenity === 'dentist') return 'Dental';
  if (tags.amenity === 'veterinary') return 'Veterinary';
  if (tags.amenity === 'doctors') return 'Doctor';
  if (tags.amenity === 'pharmacy') return 'Pharmacy';
  if (tags.amenity === 'car_wash') return 'Car Wash';
  if (tags.shop === 'hairdresser') return 'Hair Salon';
  if (tags.shop === 'beauty') return 'Beauty Salon';
  if (tags.shop === 'florist') return 'Florist';
  if (tags.shop === 'bakery') return 'Bakery';
  if (tags.shop === 'hardware') return 'Hardware Store';
  if (tags.shop === 'car_repair') return 'Auto Repair';
  if (tags.shop === 'car') return 'Car Dealer';
  if (tags.craft === 'carpenter') return 'Carpenter';
  if (tags.craft === 'plumber') return 'Plumber';
  if (tags.craft === 'electrician') return 'Electrician';
  if (tags.craft === 'painter') return 'Painter';
  if (tags.craft === 'roofer') return 'Roofer';
  if (tags.office === 'lawyer') return 'Legal Services';
  if (tags.office === 'accountant') return 'Accounting';
  if (tags.office === 'insurance') return 'Insurance';
  if (tags.office === 'estate_agent') return 'Real Estate';
  if (tags.healthcare === 'physiotherapist') return 'Physical Therapy';
  if (tags.leisure === 'fitness_centre') return 'Fitness';
  if (tags.leisure === 'spa') return 'Spa';
  if (tags.shop) return 'Retail';
  
  return 'Other';
}

/**
 * Check if business has a website based on OSM data
 * Note: OSM data is crowdsourced and often incomplete. 
 * "Unknown" means we don't have data, not that they don't have a website.
 */
export function getWebsiteStatus(node: OverpassNode): 'has' | 'none' | 'unknown' {
  // Check for explicit website tags
  if (node.tags.website || node.tags['contact:website']) return 'has';
  
  // Check for "no website" tag (some OSM contributors explicitly mark this)
  if (node.tags['website'] === 'no' || node.tags['contact:website'] === 'no') return 'none';
  
  // Everything else is unknown - OSM might just not have the data yet
  return 'unknown';
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}
