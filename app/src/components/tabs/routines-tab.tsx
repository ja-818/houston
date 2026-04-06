import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core";
import { ContentArea } from "../shell/content-area";
import type { TabProps } from "../../lib/types";

export default function RoutinesTab(_props: TabProps) {
  return (
    <ContentArea centered>
      <div className="flex-1 flex items-center justify-center">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>Routines coming soon</EmptyTitle>
            <EmptyDescription>
              Automated routines and scheduled tasks will be available here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </ContentArea>
  );
}
