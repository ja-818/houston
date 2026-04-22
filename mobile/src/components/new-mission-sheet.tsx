import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  SYNC_MSG_TYPES,
  newMsgId,
  type MissionCreatedPayload,
  type MissionErrorPayload,
} from "@houston-ai/sync-protocol";
import { useMobileStore } from "@/lib/store";
import { syncClient } from "@/lib/sync-client";
import type { AgentNameEntry } from "@/lib/types";
import { NewMissionAgentPicker } from "./new-mission-agent-picker";
import { NewMissionCompose } from "./new-mission-compose";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "pick-agent" | "compose";

const SEND_TIMEOUT_MS = 15_000;

/**
 * Bottom sheet for starting a new mission from the phone.
 *
 * Two-step flow:
 *   1. pick-agent — list of agents
 *   2. compose    — textarea, send button
 *
 * Send path:
 *   - mint msgId, emit CREATE_MISSION
 *   - wait for MISSION_CREATED (navigate to chat) or MISSION_ERROR (show)
 *   - 15s timeout -> error
 */
export function NewMissionSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const agentNames = useMobileStore((s) => s.agentNames);
  const isConnected = useMobileStore((s) => s.isConnected);
  const connected = isConnected();

  const [step, setStep] = useState<Step>("pick-agent");
  const [selectedAgent, setSelectedAgent] = useState<AgentNameEntry | null>(
    null,
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when the sheet closes.
  useEffect(() => {
    if (!open) {
      setStep("pick-agent");
      setSelectedAgent(null);
      setText("");
      setSending(false);
      setError(null);
    }
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function pickAgent(agent: AgentNameEntry) {
    setSelectedAgent(agent);
    setStep("compose");
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !selectedAgent || sending) return;
    if (!connected) {
      setError("Not connected. Reconnect first.");
      return;
    }

    const msgId = newMsgId();
    setSending(true);
    setError(null);

    const cleanup: Array<() => void> = [];
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      for (const c of cleanup) c();
      fn();
    };

    cleanup.push(
      syncClient.on(SYNC_MSG_TYPES.MISSION_CREATED, (payload: unknown) => {
        const p = payload as MissionCreatedPayload;
        if (p?.msgId !== msgId) return;
        finish(() => {
          setSending(false);
          navigate(`/chat/${p.conversationId}`);
          onClose();
        });
      }),
    );

    cleanup.push(
      syncClient.on(SYNC_MSG_TYPES.MISSION_ERROR, (payload: unknown) => {
        const p = payload as MissionErrorPayload;
        if (p?.msgId !== msgId) return;
        finish(() => {
          setSending(false);
          setError(p.message || "Could not start the mission.");
        });
      }),
    );

    const timeoutId = window.setTimeout(() => {
      finish(() => {
        setSending(false);
        setError("Connection timed out. Try again.");
      });
    }, SEND_TIMEOUT_MS);
    cleanup.push(() => window.clearTimeout(timeoutId));

    syncClient.send(SYNC_MSG_TYPES.CREATE_MISSION, {
      agentId: selectedAgent.id,
      text: trimmed,
      msgId,
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-[430px] flex-col rounded-t-2xl bg-background shadow-2xl safe-bottom"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="New mission"
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {step === "pick-agent" ? (
              <NewMissionAgentPicker
                agents={agentNames}
                onPick={pickAgent}
                onClose={onClose}
              />
            ) : (
              <NewMissionCompose
                agent={selectedAgent!}
                text={text}
                setText={setText}
                sending={sending}
                error={error}
                connected={connected}
                onBack={() => setStep("pick-agent")}
                onSend={send}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
