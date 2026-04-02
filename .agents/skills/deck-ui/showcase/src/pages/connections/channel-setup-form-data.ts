import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const USAGE_CODE = `import { useState } from "react"
import { ChannelSetupForm } from "@deck-ui/connections"
import type { ChannelType } from "@deck-ui/connections"

function MySetup() {
  const [type, setType] = useState<ChannelType>("slack")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (config: Record<string, string>) => {
    setLoading(true)
    setError(null)
    try {
      await testConnection(type, config)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChannelSetupForm
      type={type}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      loading={loading}
      error={error}
    />
  )
}`;

/* ── Props definitions ───────────────────────────────────────── */

export const FORM_PROPS: PropDef[] = [
  { name: "type", type: '"slack" | "telegram"', description: "Channel type — determines which form fields are shown" },
  { name: "onSubmit", type: "(config: Record<string, string>) => void", description: "Called with the form config when Test Connection is clicked" },
  { name: "onCancel", type: "() => void", description: "Called when the Cancel button is clicked. Button hidden if not provided." },
  { name: "loading", type: "boolean", default: "false", description: "Disables submit and shows a spinner" },
  { name: "error", type: "string | null", default: "null", description: "Error message shown above the action buttons" },
];
