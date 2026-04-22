import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core"

export interface EventEmptyProps {
  message?: string
}

export function EventEmpty({
  message = "Heartbeats, cron jobs, and channel messages will appear here as they happen.",
}: EventEmptyProps) {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyTitle>No events</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
