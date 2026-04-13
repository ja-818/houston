import { Spinner } from "@houston-ai/core";
import { ProviderPicker } from "../shell/provider-picker";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useUIStore } from "../../stores/ui";

export function SettingsView() {
  const currentWorkspace = useWorkspaceStore((s) => s.current);
  const updateProvider = useWorkspaceStore((s) => s.updateProvider);
  const addToast = useUIStore((s) => s.addToast);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const handleSelect = async (provider: string, model: string) => {
    await updateProvider(currentWorkspace.id, provider, model);
    const provName = provider === "openai" ? "OpenAI" : "Anthropic";
    addToast({ title: `Switched to ${provName} (${model})` });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-lg px-6 py-8">
        <h1 className="text-xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-2">
          AI provider for <strong className="text-foreground font-medium">{currentWorkspace.name}</strong>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Houston uses <strong className="text-foreground font-medium">your own</strong> subscription.
          We never see your credentials. You pay your provider directly.
        </p>

        <ProviderPicker
          value={currentWorkspace.provider ?? null}
          model={currentWorkspace.model ?? null}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
