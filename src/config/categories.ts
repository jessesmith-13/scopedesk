/**
 * Centralized category configuration for the CRM
 * Ensures alignment between import search categories and filter dropdown
 */

export interface CategoryGroup {
  value: string;
  label: string;
  description?: string;
}

/**
 * High-level category groups used for both:
 * - Import/search queries (Google Places & Overpass API)
 * - Filter dropdown in Dashboard
 */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    value: 'all',
    label: 'All Categories',
    description: 'All business types'
  },
  {
    value: 'restaurants',
    label: 'Restaurants & Cafes',
    description: 'Restaurants, cafes, bars, bakeries'
  },
  {
    value: 'salons',
    label: 'Salons & Spas',
    description: 'Beauty salons, hair care, spas'
  },
  {
    value: 'contractors',
    label: 'Contractors & Home Services',
    description: 'Electricians, plumbers, painters, roofers, auto repair'
  },
  {
    value: 'dental',
    label: 'Dental Offices',
    description: 'Dentists and dental practices'
  },
  {
    value: 'fitness',
    label: 'Fitness & Gyms',
    description: 'Gyms and fitness centers'
  },
  {
    value: 'retail',
    label: 'Retail Stores',
    description: 'Clothing, hardware, electronics, pet stores, florists'
  },
  {
    value: 'automotive',
    label: 'Automotive',
    description: 'Auto repair, car wash, car dealers'
  },
  {
    value: 'professional',
    label: 'Professional Services',
    description: 'Lawyers, accountants, real estate, insurance'
  },
  {
    value: 'health',
    label: 'Healthcare',
    description: 'Doctors, pharmacies, veterinary'
  }
];
