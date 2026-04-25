import { ArrowDownCircle, RotateCw, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateChecker } from "../../hooks/use-update-checker";

export function UpdateChecker() {
  const { t } = useTranslation("shell");
  const { status, relaunch } = useUpdateChecker();

  if (status.state === "idle") return null;

  if (status.state === "available") {
    return (
      <button
        onClick={status.install}
        className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-border/50 bg-accent/50 px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
      >
        <ArrowDownCircle className="size-4 text-primary shrink-0" />
        <span className="truncate">{t("updateChecker.available", { version: status.version })}</span>
      </button>
    );
  }

  if (status.state === "downloading") {
    return (
      <div className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-border/50 bg-accent/50 px-3 py-2 text-xs text-foreground">
        <Loader2 className="size-4 animate-spin text-primary shrink-0" />
        <span className="truncate">{t("updateChecker.downloading", { progress: status.progress })}</span>
      </div>
    );
  }

  if (status.state === "ready") {
    return (
      <button
        onClick={relaunch}
        className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground transition-colors hover:bg-primary/20"
      >
        <RotateCw className="size-4 text-primary shrink-0" />
        <span className="truncate">{t("updateChecker.restart")}</span>
      </button>
    );
  }

  return null;
}
