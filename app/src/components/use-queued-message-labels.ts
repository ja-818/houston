import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { QueuedMessageLabels } from "@houston-ai/chat";

export function useQueuedMessageLabels(): QueuedMessageLabels {
  const { t } = useTranslation("chat");
  return useMemo(
    () => ({
      title: t("queue.title"),
      remove: t("queue.remove"),
      attachmentsOnly: t("queue.attachmentsOnly"),
    }),
    [t],
  );
}
