import type { AddSkillDialogLabels } from "./add-skill-dialog"

export interface SkillsGridLabels {
  loading?: string
  emptyTitle?: string
  emptyDescription?: string
  addSkill?: string
  descriptionShort?: string
  deleteTitle?: (name: string) => string
  deleteTitleFallback?: string
  deleteDescription?: string
  deleteConfirmLabel?: string
  addDialog?: AddSkillDialogLabels
}

export const DEFAULT_SKILLS_GRID_LABELS: Required<Omit<SkillsGridLabels, "addDialog">> = {
  loading: "Loading actions...",
  emptyTitle: "No actions installed",
  emptyDescription: "Actions are reusable procedures your agent can run.",
  addSkill: "Add action",
  descriptionShort: "Reusable procedures your agent can lean on.",
  deleteTitle: (name) => `Delete "${name}"?`,
  deleteTitleFallback: "Delete action?",
  deleteDescription: "This removes the action from your agent. You can reinstall it later.",
  deleteConfirmLabel: "Delete",
}
