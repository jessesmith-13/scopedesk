// Lead scoring calculation logic
// Based on /src/imports/lead-score.ts specification

import type { Lead } from '@/types/lead';

/**
 * Calculates a lead score (0-100) based on various factors
 * Higher scores indicate more valuable leads for outreach
 */
export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 0;
  
  // 1. Website presence (max 25 points)
  // Businesses without websites are high-value opportunities
  if (lead.websiteStatus === 'no_website') {
    score += 25;
  } else if (lead.websiteStatus === 'has_website') {
    score += 5;
  }
  // unknown website status = 0 points
  
  // 2. Google rating (max 25 points)
  // Lower ratings indicate potential need for marketing/reputation help
  if (lead.rating !== null && lead.rating !== undefined) {
    if (lead.rating < 3.5) {
      score += 25;
    } else if (lead.rating >= 3.5 && lead.rating < 4.0) {
      score += 15;
    } else if (lead.rating >= 4.0 && lead.rating < 4.5) {
      score += 10;
    } else if (lead.rating >= 4.5) {
      score += 5;
    }
  }
  
  // 3. Review count (max 25 points)
  // Businesses with fewer reviews have weaker online presence
  if (lead.reviewCount !== null && lead.reviewCount !== undefined) {
    if (lead.reviewCount < 10) {
      score += 25;
    } else if (lead.reviewCount >= 10 && lead.reviewCount < 50) {
      score += 15;
    } else if (lead.reviewCount >= 50 && lead.reviewCount < 150) {
      score += 10;
    } else if (lead.reviewCount >= 150) {
      score += 5;
    }
  }
  
  // 4. Phone number presence (10 points)
  // Easier outreach when phone exists
  if (lead.phone) {
    score += 10;
  }
  
  // 5. Industry priority (max 15 points)
  // These industries historically convert well for marketing services
  if (lead.category) {
    const category = lead.category.toLowerCase();
    if (category.includes('restaurant')) {
      score += 15;
    } else if (category.includes('contractor') || category.includes('construction')) {
      score += 15;
    } else if (category.includes('dentist') || category.includes('dental')) {
      score += 15;
    } else if (category.includes('lawyer') || category.includes('legal') || category.includes('attorney')) {
      score += 10;
    }
  }
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}
