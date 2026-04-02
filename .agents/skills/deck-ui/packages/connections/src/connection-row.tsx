import { Check } from "lucide-react";
import { useState } from "react";
import type { Connection } from "./types";

interface ConnectionRowProps {
  connection: Connection;
}

export function ConnectionRow({ connection }: ConnectionRowProps) {
  const [imgError, setImgError] = useState(false);
  const initial = connection.display_name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3.5 px-1 py-3">
      {/* App icon */}
      {!imgError ? (
        <img
          src={connection.logo_url}
          alt={connection.display_name}
          className="size-10 rounded-[10px] object-contain shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="size-10 rounded-[10px] bg-accent flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-muted-foreground">
            {initial}
          </span>
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">
          {connection.display_name}
        </p>
        <p className="text-[12px] text-muted-foreground truncate">
          {connection.email ?? connection.description}
        </p>
      </div>

      {/* Connected indicator */}
      <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <Check className="size-3 text-emerald-600" strokeWidth={2.5} />
      </div>
    </div>
  );
}
