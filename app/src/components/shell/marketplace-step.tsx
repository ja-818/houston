import { DialogTitle, Input, cn } from "@houston-ai/core";
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
      <div className="shrink-0 px-6 pt-6 space-y-4">
        <DialogTitle className="text-xl font-semibold">
          Create a workspace
        </DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search workspaces..."
            className="pl-9 rounded-full bg-gray-50 border-black/5 focus:bg-white"
          />
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-5 px-6 border-b border-black/5">
        {categories.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "relative pb-2.5 pt-3 text-sm transition-colors duration-200",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cat.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {houstonExps.length > 0 && (
          <section>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              By Houston
            </p>
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
    </>
  );
}
