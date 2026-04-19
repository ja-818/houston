import { useState } from "react"
import { Check, Copy, Trash2 } from "lucide-react"
import type { Skill } from "./types"

export interface SkillRowProps {
  skill: Skill
  onClick: () => void
  onDelete?: () => void
}

export function SkillRow({ skill, onClick, onDelete }: SkillRowProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(skill.name)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("[skills] Copy failed:", err)
    }
  }

  return (
    <div
      className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border
                 bg-background hover:border-border/80 transition-all"
    >
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sm font-medium text-foreground truncate">
          {skill.name}
        </p>
        {skill.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {skill.description}
          </p>
        )}
      </button>
      <button
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy skill name"}
        className="shrink-0 size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="Delete skill"
          className="shrink-0 size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}
