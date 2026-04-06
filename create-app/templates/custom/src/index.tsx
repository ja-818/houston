import type { FC } from "react";

/**
 * Custom tab component for {{NAME_TITLE}}.
 *
 * This component is loaded by Houston when your experience
 * declares a tab with `customComponent: "CustomTab"` in manifest.json.
 *
 * Props are injected by Houston at runtime:
 * - workspace: { id, name, folderPath, experienceId }
 * - readFile(name) / writeFile(name, content) / listFiles()
 * - sendMessage(text) — send a message to the AI assistant
 */

interface CustomTabProps {
  workspace: { id: string; name: string; folderPath: string };
  readFile: (name: string) => Promise<string>;
  writeFile: (name: string, content: string) => Promise<void>;
  listFiles: () => Promise<Array<{ path: string; name: string; size: number }>>;
  sendMessage: (text: string) => void;
}

export const CustomTab: FC<CustomTabProps> = ({ workspace, sendMessage }) => {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        {{NAME_TITLE}}
      </h2>
      <p style={{ color: "#676767", marginBottom: 16 }}>
        Custom tab for workspace: {workspace.name}
      </p>
      <button
        onClick={() => sendMessage("Hello from the custom tab!")}
        style={{
          background: "#0d0d0d",
          color: "#fff",
          border: "none",
          borderRadius: 9999,
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Send message to AI
      </button>
    </div>
  );
};
