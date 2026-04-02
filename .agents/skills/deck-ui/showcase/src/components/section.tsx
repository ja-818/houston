import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </div>
  );
}
