import { SkillIcon } from "./skill-icon";
import { IntegrationLogos } from "./integration-logos";
import type { ActionInvocation } from "../lib/action-message";

interface Props {
  invocation: ActionInvocation;
}

/**
 * Read-only card rendered in place of a plain user_message body when the
 * user submitted an action. Mirrors the SkillCard / ActionForm visual
 * (round image bubble + title + description + integrations) and lists
 * the labelled values the user filled.
 *
 * The card sits in the right column of the conversation (where user
 * bubbles live) so the speaker attribution stays the same.
 */
export function UserActionMessage({ invocation }: Props) {
  const { displayName, image, description, integrations, fields } = invocation;
  return (
    <div className="rounded-2xl bg-secondary p-4 max-w-md inline-block text-left">
      <div className="flex items-start gap-3">
        <SkillIcon image={image} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {displayName}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
          {integrations.length > 0 && (
            <div className="mt-2">
              <IntegrationLogos toolkits={integrations} />
            </div>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
          {fields.map((f, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">
                {f.label}
              </span>
              <span className="text-xs text-foreground break-words whitespace-pre-wrap">
                {f.value || (
                  <span className="italic text-muted-foreground">empty</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
