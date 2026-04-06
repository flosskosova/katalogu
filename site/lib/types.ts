/**
 * Structured catalog schema — extend with CMS or MDX later without breaking the UI.
 */

export type MaintenanceStatus = "active" | "slow" | "maintenance";

export type MaturityLevel = "experimental" | "growing" | "established" | "industry-standard";

export type ToolRank = "top-pick" | "also-strong" | "honorable";

export interface Category {
  slug: string;
  name: string;
  /** Short line for cards */
  summary: string;
  /** Longer editorial intro for category pages */
  description: string;
  /** CMS: when false, category is hidden from the public site (draft preview still shows it). */
  visibleOnWebsite?: boolean;
  /** CMS Display & SEO */
  seoTitle?: string;
  seoDescription?: string;
  canonicalSlug?: string;
  ogImageUrl?: string;
}

export interface Tool {
  slug: string;
  name: string;
  categorySlug: string;
  summary: string;
  whyIncluded: string;
  bestFor: string;
  platforms: string[];
  license: string;
  maintenanceStatus: MaintenanceStatus;
  maturity: MaturityLevel;
  strengths: string[];
  limitations: string[];
  /** Display names; may overlap with other tools */
  alternatives: string[];
  /** Common proprietary Windows/macOS (or paid cross-platform) stacks this tool often replaces */
  replacesProprietary?: string;
  officialSite: string;
  sourceRepo: string;
  /** Optional docs homepage (CMS) */
  docsUrl?: string;
  /** Deeper body copy when present */
  longDescription?: string;
  targetUsers?: string;
  /** Resolved media URLs for the public site */
  logoUrl?: string;
  galleryUrls?: string[];
  seoTitle?: string;
  seoDescription?: string;
  /** If set, use for canonical URL path segment */
  canonicalSlug?: string;
  ogImageUrl?: string;
  tags: string[];
  rank: ToolRank;
  /** CMS: include in homepage “Top picks” even when rank is not Top pick */
  homepageTopPick?: boolean;
  /** CMS editorial sort (higher first within rank) */
  editorialWeight?: number;
  /** Curated facets for filters */
  privacyFocused?: boolean;
  selfHosted?: boolean;
  beginnerFriendly?: boolean;
  /** Curated facets (mirrors CMS checkboxes) */
  developerFocused?: boolean;
  endUserFocused?: boolean;
  /** Explicit related tool slugs (editorial) */
  relatedSlugs?: string[];
  /** CMS: when false, tool is hidden from the public site (draft preview still shows it). */
  visibleOnWebsite?: boolean;
}

export interface ToolWithCategory extends Tool {
  category: Category;
}

/** Curated list from CMS `curated-collections` */
export interface CuratedCollectionItem {
  tool: ToolWithCategory;
  blurb?: string;
}

export interface CuratedCollectionView {
  slug: string;
  name: string;
  description: string;
  displayStyle: string;
  items: CuratedCollectionItem[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface SearchFilters {
  query: string;
  categorySlug: string | null;
  platforms: string[];
  licenseContains: string;
  privacyFocused: boolean | null;
  selfHosted: boolean | null;
  beginnerFriendly: boolean | null;
  maturity: MaturityLevel | null;
  maintenanceStatus: MaintenanceStatus | null;
  tags: string[];
}
