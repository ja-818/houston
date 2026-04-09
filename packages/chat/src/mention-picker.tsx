/**
 * MentionPicker — floating list rendered above the composer when the `@`
 * trigger is active. Presentational: receives filtered options + the
 * selected index + an onSelect callback. Stateless.
 */

import type { MentionOption } from "./use-mention-picker";

export interface MentionPickerProps {
  options: MentionOption[];
  selectedIndex: number;
  onSelect: (option: MentionOption) => void;
  onHover?: (index: number) => void;
}

export function MentionPicker({
  options,
  selectedIndex,
  onSelect,
  onHover,
}: MentionPickerProps) {
  if (options.length === 0) return null;
  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.4)]"
      role="listbox"
      // Prevent the textarea from losing focus when clicking an option.
      onMouseDown={(e) => e.preventDefault()}
    >
      {options.map((option, index) => {
        const isActive = index === selectedIndex;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(option)}
            onMouseEnter={() => onHover?.(index)}
            className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors ${
              isActive ? "bg-[#f5f5f5]" : "bg-transparent hover:bg-[#f5f5f5]"
            }`}
          >
            <span className="text-sm font-medium text-[#0d0d0d]">
              {option.label}
            </span>
            {option.description && (
              <span className="line-clamp-1 text-xs text-[#5d5d5d]">
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
