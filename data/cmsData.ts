import { LandingPageCMS, CMSHistory, CMSVersion } from '@/types';

// Default/Initial Landing Page Content
export const DEFAULT_LANDING_PAGE_CMS: LandingPageCMS = {
  id: 'landing-v1',
  version: 1,
  lastUpdated: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  status: 'published',
  sections: {
    hero: {
      badge: {
        icon: true,
        text: 'Premium PC Components'
      },
      headline: {
        line1: 'Build Without',
        line2: 'Compromise',
        line2Gradient: true
      },
      subheadline: 'Curated components from world-class manufacturers. Every part selected for performance, reliability, and value.',
      primaryCTA: {
        text: 'Explore Catalog',
        link: '/catalog'
      },
      secondaryCTA: {
        text: 'View Builds',
        link: '/saved-builds'
      },
      stats: [
        { value: '900+', label: 'Components' },
        { value: '15k+', label: 'Builds' },
        { value: '24/7', label: 'Support' }
      ],
      heroImage: {
        url: 'https://bitkart.com/cdn/shop/files/H9Flowwhite_83af798d-a30c-4498-8756-40feba6935e3.png?v=1759604552',
        alt: 'Featured Component'
      },
      floatingBadge: {
        title: 'Authorized Dealer',
        subtitle: 'Full warranty coverage'
      }
    },
    categories: {
      sectionTitle: 'Shop by Category',
      categories: [
        { id: 'cat-1', name: 'Processors', icon: 'Cpu', categoryKey: 'Processor', order: 1 },
        { id: 'cat-2', name: 'Graphics', icon: 'Monitor', categoryKey: 'Graphics Card', order: 2 },
        { id: 'cat-3', name: 'Boards', icon: 'Cpu', categoryKey: 'Motherboard', order: 3 },
        { id: 'cat-4', name: 'Memory', icon: 'Zap', categoryKey: 'RAM', order: 4 },
        { id: 'cat-5', name: 'Storage', icon: 'Package', categoryKey: 'Storage', order: 5 },
        { id: 'cat-6', name: 'Cooling', icon: 'Cpu', categoryKey: 'Cooler', order: 6 }
      ]
    },
    featuredProducts: {
      sectionTitle: 'Featured Products',
      sectionSubtitle: 'Hand-selected components for exceptional performance',
      productIds: [], // Will be populated dynamically from PRODUCTS
      ctaText: 'View All Products',
      ctaLink: '/catalog'
    },
    trustIndicators: {
      features: [
        {
          id: 'trust-1',
          icon: 'Shield',
          title: 'Authentic Products',
          description: 'All components sourced directly from authorized distributors with genuine warranties',
          order: 1
        },
        {
          id: 'trust-2',
          icon: 'Zap',
          title: 'Fast Shipping',
          description: 'Same-day dispatch for orders before 2PM with real-time tracking',
          order: 2
        },
        {
          id: 'trust-3',
          icon: 'Headphones',
          title: 'Expert Support',
          description: 'Dedicated PC building specialists available 24/7 for consultation',
          order: 3
        },
        {
          id: 'trust-4',
          icon: 'TrendingUp',
          title: 'Best Value',
          description: 'Competitive pricing with exclusive bundle discounts and deals',
          order: 4
        }
      ]
    },
    finalCTA: {
      headline: 'Ready to Build?',
      subheadline: 'Start configuring your dream PC with our comprehensive catalog of premium components',
      ctaText: 'Browse Catalog',
      ctaLink: '/catalog',
      backgroundStyle: 'gradient'
    }
  }
};

// CMS History for versioning
export const CMS_HISTORY: CMSHistory = {
  versions: [
    {
      id: 'v1',
      version: 1,
      content: DEFAULT_LANDING_PAGE_CMS,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      note: 'Initial landing page setup'
    }
  ],
  current: 'v1'
};

// In-memory storage (replace with API/database in production)
let currentCMS: LandingPageCMS = { ...DEFAULT_LANDING_PAGE_CMS };
let cmsHistory: CMSHistory = { ...CMS_HISTORY };

// CMS Service Functions
export const cmsService = {
  // Get current published content
  getPublishedContent: (): LandingPageCMS => {
    return { ...currentCMS };
  },

  // Get draft content
  getDraftContent: (): LandingPageCMS | null => {
    const draft = cmsHistory.versions.find(v => v.content.status === 'draft');
    return draft ? { ...draft.content } : null;
  },

  // Save draft
  saveDraft: (content: LandingPageCMS): void => {
    const draftContent: LandingPageCMS = {
      ...content,
      lastUpdated: new Date().toISOString(),
      status: 'draft'
    };

    // Remove old draft if exists
    cmsHistory.versions = cmsHistory.versions.filter(v => v.content.status !== 'draft');

    // Add new draft version
    const newVersion: CMSVersion = {
      id: `draft-${Date.now()}`,
      version: content.version,
      content: draftContent,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      note: 'Draft saved'
    };

    cmsHistory.versions.push(newVersion);
  },

  // Publish content
  publishContent: (content: LandingPageCMS): void => {
    const publishedContent: LandingPageCMS = {
      ...content,
      version: currentCMS.version + 1,
      lastUpdated: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      status: 'published'
    };

    // Update current published content
    currentCMS = publishedContent;

    // Add to history
    const newVersion: CMSVersion = {
      id: `v${publishedContent.version}`,
      version: publishedContent.version,
      content: publishedContent,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      note: 'Published update'
    };

    // Remove draft if exists
    cmsHistory.versions = cmsHistory.versions.filter(v => v.content.status !== 'draft');
    cmsHistory.versions.push(newVersion);
    cmsHistory.current = newVersion.id;
  },

  // Get version history
  getHistory: (): CMSHistory => {
    return { ...cmsHistory };
  },

  // Restore from version
  restoreVersion: (versionId: string): void => {
    const version = cmsHistory.versions.find(v => v.id === versionId);
    if (version) {
      currentCMS = {
        ...version.content,
        version: currentCMS.version + 1,
        lastUpdated: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        status: 'published'
      };

      const newVersion: CMSVersion = {
        id: `v${currentCMS.version}`,
        version: currentCMS.version,
        content: currentCMS,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin',
        note: `Restored from version ${version.version}`
      };

      cmsHistory.versions.push(newVersion);
      cmsHistory.current = newVersion.id;
    }
  },

  // Reset to defaults
  resetToDefaults: (): void => {
    currentCMS = { ...DEFAULT_LANDING_PAGE_CMS };
    cmsHistory = { ...CMS_HISTORY };
  }
};