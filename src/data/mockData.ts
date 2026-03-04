import type { Lead } from '@/types/lead';

// Template type definition
export interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
}

export const mockLeads: Lead[] = [
  {
    id: '1',
    userId: 'user-1',
    businessName: 'Pike Place Flower Shop',
    category: 'Florist',
    subCategory: null,
    neighborhood: 'Downtown',
    addressLine1: '1501 Pike Pl',
    addressLine2: null,
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'US',
    lat: 47.6097,
    lng: -122.3417,
    phone: '(206) 555-0101',
    websiteUrl: null,
    websiteStatus: 'no_website',
    outreachStatus: 'not_contacted',
    score: 65,
    scoreReason: null,
    source: null,
    sourcePlaceId: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'user-1',
    businessName: "Tony's Coffee Bar",
    category: 'Cafe',
    subCategory: null,
    neighborhood: 'University District',
    addressLine1: '4556 University Way NE',
    addressLine2: null,
    city: 'Seattle',
    state: 'WA',
    postalCode: '98105',
    country: 'US',
    lat: 47.6615,
    lng: -122.3125,
    phone: '(206) 555-0202',
    websiteUrl: 'http://tonyscoffee.example.com',
    websiteStatus: 'has_website',
    outreachStatus: 'contacted',
    score: 25,
    scoreReason: null,
    source: null,
    sourcePlaceId: null,
    notes: 'Spoke with owner Tony. Interested in website redesign. Current site is slow and not mobile-friendly. Set follow-up for next week.',
    createdAt: '2026-02-28T10:30:00Z',
    updatedAt: '2026-02-28T10:30:00Z'
  }
];

export const mockTemplates: Template[] = [
  {
    id: 't1',
    name: 'Walk-in Pitch (No Website)',
    type: 'walk_in',
    content: `Hi, I'm a local web developer based in Seattle. I noticed {business_name} doesn't have a website yet. I help small businesses like yours get online with professional websites that bring in new customers.

I'd love to show you some quick examples of my work with similar businesses in the area. Do you have a few minutes to chat, or would you prefer I leave my card?

[Portfolio link: {portfolio_link}]`
  },
  {
    id: 't2',
    name: 'Cold Email (Website Audit)',
    type: 'email',
    content: `Subject: Quick website suggestion for {business_name}

Hi there,

I'm a freelance web developer working with local Seattle businesses. I came across {business_name} and took a quick look at your website.

I noticed: {audit_issue}

I specialize in helping small businesses improve their online presence. Would you be interested in a free 15-minute call to discuss how a few improvements could help you get more customers?

My recent work: {portfolio_link}

Best,
[Your Name]
[Contact Info]`
  },
  {
    id: 't3',
    name: 'Follow-up Email',
    type: 'follow_up',
    content: `Subject: Following up on {business_name} website

Hi,

Just wanted to follow up on our conversation from last week. I put together some ideas for {business_name}'s website that I think could really help with [specific issue mentioned].

Are you available for a quick call this week to discuss? I'm flexible on timing.

Looking forward to hearing from you!

Best,
[Your Name]
{portfolio_link}`
  }
];