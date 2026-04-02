import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let cancelled = false;
    import("shiki").then(({ codeToHtml }) =>
      codeToHtml(code.trim(), { lang: language, theme: "github-dark" }).then(
        (result) => !cancelled && setHtml(result),
      ),
    );
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg overflow-hidden bg-[#24292e]">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <span className="text-[11px] text-white/30 font-mono select-none">
          {language}
        </span>
        <button
          onClick={copy}
          className="size-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
      {html ? (
        <div
          className="text-[13px] leading-relaxed [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 text-[#e1e4e8] text-[13px] leading-relaxed overflow-x-auto">
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  );
}
