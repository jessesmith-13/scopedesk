// Deduplication utilities for leads

/**
 * Normalize a string for deduplication:
 * - lowercase
 * - strip punctuation
 * - collapse whitespace
 * - normalize street abbreviations
 * - normalize suite/unit patterns
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  let normalized = text.toLowerCase().trim();
  
  // Strip punctuation except spaces and #
  normalized = normalized.replace(/[^\w\s#]/g, '');
  
  // Normalize street types
  const streetNormalizations: Record<string, string> = {
    'street': 'st',
    'avenue': 'ave',
    'boulevard': 'blvd',
    'drive': 'dr',
    'road': 'rd',
    'lane': 'ln',
    'court': 'ct',
    'place': 'pl',
    'way': 'way',
  };
  
  for (const [full, abbr] of Object.entries(streetNormalizations)) {
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }
  
  // Normalize suite/unit patterns
  normalized = normalized.replace(/\bsuite\b/g, 'ste');
  normalized = normalized.replace(/\bunit\b/g, 'ste');
  normalized = normalized.replace(/\bapartment\b/g, 'apt');
  normalized = normalized.replace(/\b#\s*/g, 'ste');
  
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Normalize phone to E.164 format (US only for now)
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  return digits;
}

/**
 * Round coordinate to 4 decimal places (~11m precision)
 */
function roundCoord(coord: number | null | undefined): string {
  if (coord == null) return '';
  return coord.toFixed(4);
}

/**
 * Compute dedupe_key for a lead
 * 
 * Primary: name + postal_code + address
 * Fallback: name + rounded lat/lng
 */
export function computeDedupeKey(lead: {
  business_name: string;
  address_line1?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const nameLower = normalizeText(lead.business_name);
  if (!nameLower) return null;
  
  // Primary: name + postal + address
  if (lead.postal_code && lead.address_line1) {
    const addressNorm = normalizeText(lead.address_line1);
    const postalNorm = lead.postal_code.replace(/\s/g, '').toLowerCase();
    return `${nameLower}|${postalNorm}|${addressNorm}`;
  }
  
  // Fallback: name + lat/lng
  if (lead.lat != null && lead.lng != null) {
    const latRound = roundCoord(lead.lat);
    const lngRound = roundCoord(lead.lng);
    return `${nameLower}|${latRound}|${lngRound}`;
  }
  
  // No good dedupe key possible
  return null;
}