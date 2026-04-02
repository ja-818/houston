import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@deck-ui/core"

export interface MemoryEmptyProps {
  message?: string
}

export function MemoryEmpty({
  message = "Memories will appear here as your agent learns from conversations.",
}: MemoryEmptyProps) {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyTitle>No memories</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
