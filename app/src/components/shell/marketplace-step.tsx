import { DialogTitle, Input, ScrollArea } from "@houston-ai/core";
import { Search } from "lucide-react";
import type { Experience, ExperienceCategory } from "../../lib/types";
import { ExperienceCard } from "./experience-card";

const categories: { id: "all" | ExperienceCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "productivity", label: "Productivity" },
  { id: "development", label: "Development" },
  { id: "research", label: "Research" },
  { id: "creative", label: "Creative" },
  { id: "business", label: "Business" },
];

interface MarketplaceStepProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: "all" | ExperienceCategory;
  onCategoryChange: (cat: "all" | ExperienceCategory) => void;
  houstonExps: Experience[];
  communityExps: Experience[];
  hasResults: boolean;
  onSelect: (id: string) => void;
}

export function MarketplaceStep({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  houstonExps,
  communityExps,
  hasResults,
  onSelect,
}: MarketplaceStepProps) {
  return (
    <>
      <div className="px-6 pt-6 pb-4 space-y-4 border-b border-black/5">
        <DialogTitle className="text-xl font-semibold">Explore</DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search workspaces..."
            className="pl-9 rounded-full bg-gray-50 border-black/5 focus:bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat.id
                  ? "bg-gray-950 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-5 space-y-6">
          {houstonExps.length > 0 && (
            <section>
              <p className="text-xs font-medium text-muted-foreground mb-3">
                By Houston
              </p>
              <div className="grid grid-cols-3 gap-3">
                {houstonExps.map((exp) => (
                  <ExperienceCard
                    key={exp.manifest.id}
                    manifest={exp.manifest}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {communityExps.length > 0 && (
            <section>
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Community
              </p>
              <div className="grid grid-cols-3 gap-3">
                {communityExps.map((exp) => (
                  <ExperienceCard
                    key={exp.manifest.id}
                    manifest={exp.manifest}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">
                No workspaces match your search
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
