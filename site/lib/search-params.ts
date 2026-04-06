import type { SearchFilters } from "@/lib/types";
import { defaultFilters } from "@/lib/search";

export function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchFilters {
  const f = defaultFilters();
  const q = raw.q;
  if (typeof q === "string" && q) f.query = q;
  const cat = raw.category;
  if (typeof cat === "string" && cat) f.categorySlug = cat;
  const pl = raw.platform;
  if (typeof pl === "string" && pl)
    f.platforms = pl.split(",").filter(Boolean);
  const lic = raw.license;
  if (typeof lic === "string" && lic) f.licenseContains = lic;
  if (raw.privacy === "1") f.privacyFocused = true;
  if (raw.selfHosted === "1") f.selfHosted = true;
  if (raw.beginner === "1") f.beginnerFriendly = true;
  const mat = raw.maturity;
  if (
    mat === "experimental" ||
    mat === "growing" ||
    mat === "established" ||
    mat === "industry-standard"
  )
    f.maturity = mat;
  const maint = raw.maintenance;
  if (maint === "active" || maint === "slow" || maint === "maintenance")
    f.maintenanceStatus = maint;
  const tags = raw.tags;
  if (typeof tags === "string" && tags)
    f.tags = tags.split(",").filter(Boolean);
  return f;
}
