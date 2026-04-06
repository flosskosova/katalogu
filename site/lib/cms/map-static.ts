import { categories as staticCategories } from "@/data/categories";
import { withProprietaryAlternativeNote } from "@/data/proprietary-alternatives";
import { tools as staticTools } from "@/data/tools";
import type { Category, ToolWithCategory } from "@/lib/types";

export function getStaticCategories(): Category[] {
  return staticCategories.map((c) => ({ ...c }));
}

const fallbackCategory: Category = {
  slug: "uncategorized",
  name: "Uncategorized",
  summary: "",
  description: "",
};

export function getStaticToolsWithCategories(): ToolWithCategory[] {
  const catBySlug = new Map(staticCategories.map((c) => [c.slug, c]));
  return staticTools.map((t) => {
    const category = catBySlug.get(t.categorySlug) ?? fallbackCategory;
    return withProprietaryAlternativeNote({ ...t, category });
  });
}
