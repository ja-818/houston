import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@deck-ui/core"
import { Radio } from "lucide-react"

export interface EventEmptyProps {
  message?: string
}

export function EventEmpty({
  message = "No events yet. Activity will appear here as it happens.",
}: EventEmptyProps) {
  return (
    <Empty className="border-0 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Radio className="size-5" />
        </EmptyMedia>
        <EmptyTitle>No events</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
