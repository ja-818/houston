/**
 * useMentionPicker — headless state + keyboard logic for an `@` mention picker.
 *
 * Detects `@([\w-]*)` immediately before the caret on every text change; when
 * present, exposes a filtered list of options the consumer can render. Pick
 * logic: ArrowUp/Down wrap, Enter/Tab insert, Escape closes.
 *
 * Generic — knows nothing about skills or any specific domain.
 */

import { useCallback, useMemo, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";

export interface MentionOption {
  id: string;
  /** What gets inserted after `@` (e.g. the skill name). */
  label: string;
  description?: string;
}

export interface MentionConfig {
  options: MentionOption[];
  /**
   * Rewrites the raw text on submit. The library inserts `@label` verbatim;
   * use this to transform tokens into whatever final form the backend wants.
   */
  transformOnSend?: (text: string) => string;
}

interface MentionState {
  open: boolean;
  query: string;
  selectedIndex: number;
  /** Caret position where `@` starts. */
  triggerStart: number;
}

const CLOSED: MentionState = { open: false, query: "", selectedIndex: 0, triggerStart: -1 };

/** Find the active `@mention` range ending at `caret`, if any. */
function detectTrigger(text: string, caret: number): { start: number; query: string } | null {
  let i = caret;
  while (i > 0) {
    const ch = text[i - 1];
    if (ch === "@") {
      // Must be at start or preceded by whitespace.
      if (i - 1 === 0 || /\s/.test(text[i - 2]!)) {
        return { start: i - 1, query: text.slice(i, caret) };
      }
      return null;
    }
    if (!/[\w-]/.test(ch!)) return null;
    i--;
  }
  return null;
}

function filterOptions(options: MentionOption[], query: string): MentionOption[] {
  if (!query) return options;
  const q = query.toLowerCase();
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      (o.description?.toLowerCase().includes(q) ?? false),
  );
}

export interface UseMentionPickerArgs {
  text: string;
  setText: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  config: MentionConfig | undefined;
}

export interface UseMentionPickerResult {
  open: boolean;
  filtered: MentionOption[];
  selectedIndex: number;
  insert: (option: MentionOption) => void;
  close: () => void;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Wrap around textarea onKeyDown. When handled, calls preventDefault. */
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function useMentionPicker({
  text,
  setText,
  textareaRef,
  config,
}: UseMentionPickerArgs): UseMentionPickerResult {
  const [state, setState] = useState<MentionState>(CLOSED);

  const filtered = useMemo(() => {
    if (!state.open || !config) return [];
    return filterOptions(config.options, state.query);
  }, [state.open, state.query, config]);

  const close = useCallback(() => setState(CLOSED), []);

  const insert = useCallback(
    (option: MentionOption) => {
      if (state.triggerStart < 0) return;
      const triggerEnd = state.triggerStart + 1 + state.query.length;
      const before = text.slice(0, state.triggerStart);
      const after = text.slice(triggerEnd);
      const insertion = `@${option.label} `;
      setText(`${before}${insertion}${after}`);
      setState(CLOSED);
      // Restore caret after the inserted token on the next tick.
      const textarea = textareaRef.current;
      if (textarea) {
        const caret = before.length + insertion.length;
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(caret, caret);
        });
      }
    },
    [state.triggerStart, state.query.length, text, setText, textareaRef],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);
      // eslint-disable-next-line no-console
      console.log("[mention] change", { value, hasConfig: !!config, optionCount: config?.options.length });
      if (!config) return;
      const caret = e.target.selectionStart ?? value.length;
      const trigger = detectTrigger(value, caret);
      // eslint-disable-next-line no-console
      console.log("[mention] trigger", trigger);
      if (!trigger) {
        setState(CLOSED);
        return;
      }
      setState((prev) => ({
        open: true,
        query: trigger.query,
        triggerStart: trigger.start,
        selectedIndex: prev.query === trigger.query ? prev.selectedIndex : 0,
      }));
    },
    [config, setText],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!state.open || !config) return;
      if (filtered.length === 0) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setState((s) => ({
            ...s,
            selectedIndex: (s.selectedIndex + 1) % filtered.length,
          }));
          return;
        case "ArrowUp":
          e.preventDefault();
          setState((s) => ({
            ...s,
            selectedIndex: (s.selectedIndex - 1 + filtered.length) % filtered.length,
          }));
          return;
        case "Enter":
        case "Tab": {
          e.preventDefault();
          const option = filtered[state.selectedIndex] ?? filtered[0];
          if (option) insert(option);
          return;
        }
        case "Escape":
          e.preventDefault();
          close();
          return;
      }
    },
    [state.open, state.selectedIndex, filtered, config, close, insert],
  );

  return {
    open: state.open && filtered.length > 0,
    filtered,
    selectedIndex: state.selectedIndex,
    insert,
    close,
    handleTextChange,
    handleKeyDown,
  };
}
