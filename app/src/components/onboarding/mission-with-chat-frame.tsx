import type { ReactNode } from "react";
import { cn } from "@houston-ai/core";
import { HoustonLogo } from "../shell/experience-card";
import type { MissionMeta } from "./mission-frame";

interface MissionWithChatFrameProps {
  meta: MissionMeta;
  brandLabel: string;
  counterLabel: string;
  upNextLabel: string;
  /** Mission action UI (connect cards, time picker, etc.). */
  left: ReactNode;
  /** Tutorial chat panel. */
  right: ReactNode;
}

export function MissionWithChatFrame({
  meta,
  brandLabel,
  counterLabel,
  upNextLabel,
  left,
  right,
}: MissionWithChatFrameProps) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-black/5 bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HoustonLogo size={24} />
            <span className="text-sm font-medium">{brandLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{counterLabel}</span>
            <ProgressDots index={meta.index} total={meta.total} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        <section className="flex w-1/2 min-w-0 flex-col overflow-y-auto px-8 py-8">
          <header>
            <p className="text-xs text-muted-foreground">{meta.eyebrow}</p>
            <h1 className="mt-2 text-[28px] font-normal leading-tight">
              {meta.title}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">{meta.body}</p>
            {meta.nextTitle && (
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="text-foreground/80">{upNextLabel}</span>{" "}
                <span aria-hidden>·</span> {meta.nextTitle}
              </p>
            )}
          </header>
          <div className="mt-8 flex flex-1 flex-col">{left}</div>
        </section>

        <aside className="flex w-1/2 min-w-0 flex-col overflow-hidden border-l border-black/5 px-8 py-8">
          {right}
        </aside>
      </div>
    </div>
  );
}

function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-2 rounded-full transition-colors",
            i < index && "bg-foreground/60",
            i === index && "bg-foreground",
            i > index && "bg-foreground/15",
          )}
        />
      ))}
    </div>
  );
}
