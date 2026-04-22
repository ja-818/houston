/**
 * GithubImportView — paste owner/repo, Houston fetches + proceeds to naming.
 * No "install" step visible to the user.
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@houston-ai/core";
import { AlertCircle, Github } from "lucide-react";

interface GithubImportViewProps {
  onImport: (url: string) => Promise<string>;
}

export function GithubImportView({ onImport }: GithubImportViewProps) {
  const { t } = useTranslation("shell");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGo = useCallback(async () => {
    const trimmed = source.trim();
    if (!trimmed) return;
    setError("");
    setLoading(true);
    try {
      await onImport(trimmed);
      // Parent handles the rest (moves to naming step)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }, [source, onImport]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-6 pb-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && source.trim() && !loading) {
                  handleGo();
                }
              }}
              placeholder={t("githubImport.placeholder")}
              disabled={loading}
              autoFocus
              className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-sm
                         placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <Button
            onClick={handleGo}
            disabled={!source.trim() || loading}
            className="rounded-full shrink-0"
          >
            {loading ? <Spinner className="size-4" /> : t("githubImport.next")}
          </Button>
        </div>

        {error && (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6">
        {!loading && !error && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("githubImport.hint")}
          </p>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Spinner className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("githubImport.fetching")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
