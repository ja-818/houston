/**
 * MemoryEmpty -- Centered empty state for the memory browser.
 */
import { Brain } from "lucide-react"

export interface MemoryEmptyProps {
  message?: string
}

export function MemoryEmpty({
  message = "No memories yet",
}: MemoryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center size-12 rounded-full bg-secondary mb-4">
        <Brain className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
