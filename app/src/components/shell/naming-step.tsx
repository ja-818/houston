import type { FormEvent } from "react";
import { DialogTitle, Button, Input } from "@houston-ai/core";
import { ArrowLeft } from "lucide-react";
import type { Experience } from "../../lib/types";
import { getExperienceIcon, getExperienceIconStyle } from "./experience-card";

interface NamingStepProps {
  selectedExp: Experience | undefined;
  name: string;
  error: string | null;
  onNameChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function NamingStep({
  selectedExp,
  name,
  error,
  onNameChange,
  onBack,
  onSubmit,
}: NamingStepProps) {
  const Icon = getExperienceIcon(selectedExp?.manifest.icon);
  const style = getExperienceIconStyle(selectedExp?.manifest.icon);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <button
        onClick={onBack}
        className="absolute top-5 left-5 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <DialogTitle className="sr-only">Name your workspace</DialogTitle>

      {selectedExp && (
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${style.bg}`}>
            <Icon className={`h-7 w-7 ${style.fg}`} />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{selectedExp.manifest.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Name your new workspace
            </p>
          </div>
        </div>
      )}

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
          Create workspace
        </Button>
      </form>
    </div>
  );
}
