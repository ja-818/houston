import { type FormEvent, useEffect } from "react";
import { DialogTitle, Button, Input, cn } from "@houston-ai/core";
import { ArrowLeft, Check } from "lucide-react";
import type { AgentDefinition } from "../../lib/types";
import { getHoustonLogo, isLightColor } from "./experience-card";

const AGENT_COLORS = [
  "#f9f9f9", // white
  "#0d0d0d", // black
  // Dark (white helmet)
  "#0f3d20", // deep green
  "#162d4a", // deep blue
  "#2d0550", // deep purple
  "#6b1a1a", // deep red
  "#7c3510", // deep orange
  "#6b5010", // deep yellow
  // Light (black helmet)
  "#fef3c7", // light yellow
  "#fed7aa", // light orange
  "#fecdd3", // light red
  "#e8d5f5", // light purple
  "#dbeafe", // light blue
  "#d5f5e3", // light green
];

interface NamingStepProps {
  selectedAgent: AgentDefinition | undefined;
  name: string;
  color: string | undefined;
  error: string | null;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function NamingStep({
  selectedAgent,
  name,
  color,
  error,
  onNameChange,
  onColorChange,
  onBack,
  onSubmit,
}: NamingStepProps) {
  // Default to white on mount if none selected
  useEffect(() => {
    if (!color) {
      onColorChange(AGENT_COLORS[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logo = getHoustonLogo(color);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <button
        onClick={onBack}
        className="absolute top-5 left-5 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <DialogTitle className="sr-only">Name your Agent</DialogTitle>

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div
          className="h-20 w-20 shrink-0 rounded-full flex items-center justify-center transition-colors duration-200"
          style={{ backgroundColor: color ?? "#f5f5f5" }}
        >
          <img src={logo} alt="" className="h-12 w-12 object-contain" />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">
            {selectedAgent?.config.name ?? "New Agent"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a color and name your agent
          </p>
        </div>
      </div>

      {/* Color palette */}
      <div className="flex items-center gap-2 mb-6">
        {AGENT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c)}
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center transition-all duration-150",
              color === c
                ? "ring-2 ring-offset-2 ring-foreground/30"
                : "hover:scale-110",
            )}
            style={{ backgroundColor: c }}
          >
            {color === c && (
              <Check className={cn("h-3.5 w-3.5", isLightColor(c) ? "text-gray-700" : "text-white")} />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <Input
          autoFocus
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Project Alpha"
          className="text-center rounded-full"
        />
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
        <Button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-full"
        >
          Create Agent
        </Button>
      </form>
    </div>
  );
}
