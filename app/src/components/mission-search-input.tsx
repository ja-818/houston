import { Input } from "@houston-ai/core";
import { Loader2, Search, X } from "lucide-react";

interface MissionSearchInputLabels {
  placeholder: string;
  clear: string;
  searchingText: string;
}

interface MissionSearchInputProps {
  value: string;
  isSearchingText: boolean;
  labels: MissionSearchInputLabels;
  className?: string;
  onChange: (value: string) => void;
}

export function MissionSearchInput({
  value,
  isSearchingText,
  labels,
  className,
  onChange,
}: MissionSearchInputProps) {
  return (
    <div className={className ?? "relative"}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        role="searchbox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        autoComplete="off"
        className="rounded-full border-border bg-background pl-9 pr-16 text-sm focus:bg-background"
      />
      {isSearchingText && (
        <Loader2
          className="pointer-events-none absolute right-9 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-label={labels.searchingText}
        />
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={labels.clear}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
