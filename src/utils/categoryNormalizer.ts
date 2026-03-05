/**
 * Normalize Google Place type or any snake_case category to friendly display name
 */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return '—';
  
  const typeMap: Record<string, string> = {
    // Food & Drink
    'restaurant': 'Restaurant',
    'cafe': 'Cafe',
    'bar': 'Bar',
    'bakery': 'Bakery',
    'meal_delivery': 'Meal Delivery',
    'meal_takeaway': 'Takeaway',
    'night_club': 'Night Club',
    'coffee_shop': 'Coffee Shop',
    
    // Beauty & Wellness
    'beauty_salon': 'Beauty Salon',
    'hair_care': 'Hair Salon',
    'spa': 'Spa',
    
    // Home Services
    'electrician': 'Electrician',
    'plumber': 'Plumber',
    'painter': 'Painter',
    'roofing_contractor': 'Roofing',
    'locksmith': 'Locksmith',
    'moving_company': 'Moving',
    'car_repair': 'Auto Repair',
    'car_wash': 'Car Wash',
    
    // Health
    'dentist': 'Dental',
    'doctor': 'Doctor',
    'pharmacy': 'Pharmacy',
    'physiotherapist': 'Physical Therapy',
    'veterinary_care': 'Veterinary',
    
    // Fitness
    'gym': 'Fitness',
    
    // Retail
    'clothing_store': 'Clothing Store',
    'shoe_store': 'Shoe Store',
    'jewelry_store': 'Jewelry Store',
    'book_store': 'Book Store',
    'electronics_store': 'Electronics',
    'furniture_store': 'Furniture Store',
    'hardware_store': 'Hardware Store',
    'home_goods_store': 'Home Goods',
    'pet_store': 'Pet Store',
    'bicycle_store': 'Bike Shop',
    'florist': 'Florist',
    'convenience_store': 'Convenience Store',
    
    // Professional Services
    'accounting': 'Accounting',
    'lawyer': 'Legal Services',
    'insurance_agency': 'Insurance',
    'real_estate_agency': 'Real Estate',
    'travel_agency': 'Travel Agency',
    
    // Other
    'lodging': 'Lodging',
    'storage': 'Storage',
    'laundry': 'Laundry',
    'car_dealer': 'Car Dealer',
    'school': 'School',
    'secondary_school': 'High School',
    'shopping_mall': 'Shopping Mall',
    'supermarket': 'Supermarket',
  };
  
  // Check if we have a mapping
  if (typeMap[category]) {
    return typeMap[category];
  }
  
  // Otherwise convert snake_case to Title Case
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get the high-level category group for a specific business type
 * Maps raw categories from DB to filter group labels
 * @param rawCategory - The raw category from the database (e.g., "restaurant", "car_repair", "Doctor")
 * @returns The high-level category group label (e.g., "Restaurants & Cafes", "Automotive")
 */
export function getCategoryGroup(rawCategory: string | null | undefined): string {
  if (!rawCategory) return 'All Categories';
  
  const categoryLower = rawCategory.toLowerCase();
  
  // Restaurants & Cafes
  if ([
    'restaurant', 'cafe', 'bar', 'bakery', 'meal_delivery', 'meal_takeaway', 
    'night_club', 'coffee_shop'
  ].includes(categoryLower)) {
    return 'Restaurants & Cafes';
  }
  
  // Salons & Spas
  if ([
    'beauty_salon', 'hair_care', 'spa', 'beauty salon', 'hair salon'
  ].includes(categoryLower)) {
    return 'Salons & Spas';
  }
  
  // Contractors & Home Services
  if ([
    'electrician', 'plumber', 'painter', 'roofing_contractor', 'roofing',
    'locksmith', 'moving_company', 'moving', 'carpenter', 'roofer'
  ].includes(categoryLower)) {
    return 'Contractors & Home Services';
  }
  
  // Dental Offices
  if (['dentist', 'dental'].includes(categoryLower)) {
    return 'Dental Offices';
  }
  
  // Fitness & Gyms
  if (['gym', 'fitness'].includes(categoryLower)) {
    return 'Fitness & Gyms';
  }
  
  // Retail Stores
  if ([
    'clothing_store', 'shoe_store', 'jewelry_store', 'book_store', 
    'electronics_store', 'electronics', 'furniture_store', 'hardware_store', 
    'home_goods_store', 'home goods', 'pet_store', 'bicycle_store', 'bike shop',
    'florist', 'convenience_store', 'retail', 'clothing store', 'shoe store',
    'jewelry store', 'book store', 'furniture store', 'hardware store', 'pet store'
  ].includes(categoryLower)) {
    return 'Retail Stores';
  }
  
  // Automotive
  if ([
    'car_repair', 'car_wash', 'car_dealer', 'auto repair', 'car wash', 'car dealer'
  ].includes(categoryLower)) {
    return 'Automotive';
  }
  
  // Professional Services
  if ([
    'accounting', 'lawyer', 'insurance_agency', 'insurance', 'real_estate_agency', 
    'real estate', 'travel_agency', 'travel agency', 'legal services', 'estate_agent'
  ].includes(categoryLower)) {
    return 'Professional Services';
  }
  
  // Healthcare
  if ([
    'doctor', 'pharmacy', 'veterinary_care', 'veterinary', 'physiotherapist', 
    'physical therapy', 'doctors', 'pet services'
  ].includes(categoryLower)) {
    return 'Healthcare';
  }
  
  // Other - lodging, storage, etc.
  return 'Other';
}
