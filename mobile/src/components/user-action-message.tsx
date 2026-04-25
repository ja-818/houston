/**
 * Mobile-friendly read-only card for an action-invocation user message.
 *
 * Mirrors the desktop's UserActionMessage layout (icon + name +
 * description + integration logos + labelled values) but stays minimal:
 * no Composio catalog lookup (we fall back to favicons), no React
 * Query, just the decoded payload + plain `<img>` tags.
 */

import { useState } from "react";
import {
  type ActionInvocation,
  resolveActionImage,
} from "@houston-ai/chat";

interface Props {
  invocation: ActionInvocation;
}

export function UserActionMessage({ invocation }: Props) {
  const { displayName, image, description, integrations, fields } = invocation;
  return (
    <div className="rounded-2xl bg-secondary p-4 max-w-sm inline-block text-left">
      <div className="flex items-start gap-3">
        <ImageBubble src={resolveActionImage(image)} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {displayName}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
          {integrations.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              {integrations.map((slug) => (
                <IntegrationLogo key={slug} slug={slug} />
              ))}
            </div>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
          {fields.map((f, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">
                {f.label}
              </span>
              <span className="text-xs text-foreground break-words whitespace-pre-wrap">
                {f.value || (
                  <span className="italic text-muted-foreground">empty</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageBubble({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="size-12 rounded-full bg-input flex items-center justify-center shrink-0" />
    );
  }
  return (
    <span className="size-12 rounded-full bg-input flex items-center justify-center shrink-0 overflow-hidden">
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className="w-full h-full object-contain p-2 grayscale"
      />
    </span>
  );
}

function IntegrationLogo({ slug }: { slug: string }) {
  const [broken, setBroken] = useState(false);
  const url = `https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`;
  if (broken) {
    return (
      <span
        title={slug}
        className="size-4 rounded-[4px] bg-accent flex items-center justify-center text-[9px] font-semibold text-muted-foreground"
      >
        {slug.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={slug}
      title={slug}
      onError={() => setBroken(true)}
      className="size-4 rounded-[4px] object-contain"
    />
  );
}
