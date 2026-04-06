import type { ReactNode } from "react";

interface ContentAreaProps {
  children: ReactNode;
  /** Center content with max-width (for chat, forms). Default: false */
  centered?: boolean;
  /** Max width class when centered. Default: "max-w-3xl" */
  maxWidth?: string;
}

export function ContentArea({ children, centered = false, maxWidth = "max-w-3xl" }: ContentAreaProps) {
  if (centered) {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 flex flex-col ${maxWidth} mx-auto w-full`}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col">
      {children}
    </div>
  );
}
