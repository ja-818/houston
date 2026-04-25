import { SkillIcon } from "./skill-icon";
import { IntegrationLogos } from "./integration-logos";

interface Props {
  /** Image URL or Microsoft Fluent 3D Emoji slug. */
  image?: string | null;
  /** Card heading. */
  title: string;
  /** Optional muted description below the title. */
  description?: string;
  /** Composio toolkit slugs rendered as a small logo row at the bottom. */
  integrations?: string[];
  onClick: () => void;
  disabled?: boolean;
}

/**
 * The single source of truth for "skill card" visual treatment used in
 * the chat empty state and the New Mission picker.
 *
 * Visual contract: `rounded-2xl` card on `bg-secondary`, 48px grayscale
 * image bubble on the left, title + description + integrations stacked
 * on the right and vertically centered.
 */
export function SkillCard({
  image,
  title,
  description,
  integrations,
  onClick,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-4 rounded-2xl bg-secondary p-4 text-left transition-colors duration-200 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      <SkillIcon image={image} />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {description && (
          <span className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {description}
          </span>
        )}
        {integrations && integrations.length > 0 && (
          <IntegrationLogos toolkits={integrations} />
        )}
      </div>
    </button>
  );
}
