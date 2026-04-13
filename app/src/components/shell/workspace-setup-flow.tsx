import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, Input } from "@houston-ai/core";
import { ProviderPicker } from "./provider-picker";

interface Props {
  /** "page" = full-page onboarding, "dialog" = inside a modal */
  mode: "page" | "dialog";
  /** Called when the full flow completes */
  onComplete: (name: string, provider: string, model: string) => void;
}

export function WorkspaceSetupFlow({ mode, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("Personal");
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleProviderSelect = (p: string, m: string) => {
    setProvider(p);
    setModel(m);
  };

  const handleFinish = () => {
    if (!name.trim() || !provider || !model) return;
    onComplete(name.trim(), provider, model);
  };

  const isPage = mode === "page";

  if (step === 1) {
    return (
      <div className={isPage ? "flex flex-col items-center justify-center" : ""}>
        <div className={isPage ? "w-full max-w-sm" : "space-y-4 pt-2"}>
          {isPage && (
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-1">Name your workspace</h2>
              <p className="text-sm text-muted-foreground">
                Workspaces keep your agents organized — one for personal, one for work, etc.
              </p>
            </div>
          )}
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal, Work, Acme Corp"
            />
            <div className={isPage ? "flex justify-center" : "flex justify-end"}>
              <Button
                type="submit"
                disabled={!name.trim()}
                className="rounded-full"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={isPage ? "flex flex-col items-center justify-center" : ""}>
      <div className={isPage ? "w-full max-w-md" : "space-y-4 pt-2"}>
        {/* Header */}
        <div className={isPage ? "text-center mb-6" : "mb-4"}>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h2 className={isPage ? "text-lg font-semibold mb-1" : "text-base font-medium mb-1"}>
            Connect your AI
          </h2>
          <p className="text-sm text-muted-foreground">
            Houston uses <strong className="text-foreground font-medium">your own</strong> subscription.
            We never see your credentials.
          </p>
        </div>

        {/* Provider picker */}
        <ProviderPicker value={provider} model={model} onSelect={handleProviderSelect} />

        {/* Continue */}
        <div className={`mt-5 ${isPage ? "flex justify-center" : "flex justify-end"}`}>
          <Button
            className="rounded-full"
            disabled={!provider || !model}
            onClick={handleFinish}
          >
            {mode === "page" ? "Get started" : "Create workspace"}
          </Button>
        </div>
      </div>
    </div>
  );
}
