import { useEffect, useState } from "react";
import { Smartphone, Loader2, Unplug, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { listen } from "@tauri-apps/api/event";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@houston-ai/core";
import type { ConnectionPayload } from "@houston-ai/sync-protocol";
import { tauriSync } from "../../lib/tauri";

type SyncState =
  | { step: "idle" }
  | { step: "connecting" }
  | { step: "paired"; token: string; pairingUrl: string }
  | { step: "reconnecting"; token: string; pairingUrl: string }
  | { step: "mobile_connected"; token: string; pairingUrl: string }
  | { step: "error"; message: string };

export function MobileSyncButton() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SyncState>({ step: "idle" });

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && state.step === "idle") {
      await startPairing();
    }
    if (!isOpen && (state.step === "paired" || state.step === "mobile_connected" || state.step === "reconnecting")) {
      await disconnect();
    }
  };

  const startPairing = async () => {
    setState({ step: "connecting" });
    try {
      const info = await tauriSync.start();
      setState({
        step: "paired",
        token: info.token,
        pairingUrl: info.pairing_url,
      });
    } catch (err) {
      setState({
        step: "error",
        message: typeof err === "string" ? err : String(err),
      });
    }
  };

  const disconnect = async () => {
    try {
      await tauriSync.stop();
    } finally {
      setState({ step: "idle" });
    }
  };

  // React to phone-side connection state changes emitted by the sync responder.
  // Only meaningful once the relay is live (we have a token); otherwise we
  // have nothing to downgrade back to.
  useEffect(() => {
    const unlisten = listen<ConnectionPayload>("sync-connection", (event) => {
      const p = event.payload;
      setState((prev) => {
        const hasToken =
          prev.step === "paired" ||
          prev.step === "mobile_connected" ||
          prev.step === "reconnecting";
        if (!hasToken) return prev;
        const { token, pairingUrl } = prev;
        if (p.state === "connected") {
          return { step: "mobile_connected", token, pairingUrl };
        }
        if (p.state === "reconnecting") {
          return { step: "reconnecting", token, pairingUrl };
        }
        // disconnected -> fall back to waiting for phone
        return { step: "paired", token, pairingUrl };
      });
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Smartphone className="size-4 shrink-0" />
          <span className="truncate">Mobile companion</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect mobile app</DialogTitle>
          <DialogDescription>
            Scan this QR code with the Houston companion app to pair your phone.
          </DialogDescription>
        </DialogHeader>
        <SyncContent
          state={state}
          onRetry={startPairing}
          onDisconnect={disconnect}
        />
      </DialogContent>
    </Dialog>
  );
}

function companionUrlFor(token: string): string {
  return `https://houston-companion.pages.dev/?token=${token}`;
}

function QrBlock({ token }: { token: string }) {
  const url = companionUrlFor(token);
  return (
    <>
      <div className="rounded-xl border border-border/50 bg-white p-4">
        <QRCodeSVG
          value={url}
          size={200}
          level="M"
          bgColor="transparent"
          fgColor="#0d0d0d"
        />
      </div>
      <p className="text-[10px] text-muted-foreground break-all max-w-[240px] text-center">
        {url}
      </p>
    </>
  );
}

function StatusPill({
  tone,
  dotClassName,
  label,
}: {
  tone: "green" | "amber" | "neutral";
  dotClassName: string;
  label: string;
}) {
  const bg =
    tone === "green"
      ? "bg-green-50 text-green-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-700";
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${bg}`}>
      <span className={`size-2 rounded-full ${dotClassName}`} />
      <span className="text-xs">{label}</span>
    </div>
  );
}

function SyncContent({
  state,
  onRetry,
  onDisconnect,
}: {
  state: SyncState;
  onRetry: () => void;
  onDisconnect: () => void;
}) {
  if (state.step === "connecting") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Connecting to relay...</p>
      </div>
    );
  }

  if (state.step === "paired") {
    return (
      <div className="flex flex-col items-center gap-4">
        <QrBlock token={state.token} />
        <StatusPill tone="green" dotClassName="bg-green-500" label="Waiting for phone" />
        <DisconnectButton onClick={onDisconnect} />
      </div>
    );
  }

  if (state.step === "reconnecting") {
    return (
      <div className="flex flex-col items-center gap-4">
        <QrBlock token={state.token} />
        <StatusPill
          tone="amber"
          dotClassName="bg-amber-500 animate-pulse"
          label="Reconnecting..."
        />
        <DisconnectButton onClick={onDisconnect} />
      </div>
    );
  }

  if (state.step === "mobile_connected") {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="size-10 text-green-500" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground">Phone connected</p>
          <p className="text-xs text-muted-foreground">
            You can close this dialog — the phone will stay paired.
          </p>
        </div>
        <StatusPill tone="green" dotClassName="bg-green-500" label="Phone connected" />
        <DisconnectButton onClick={onDisconnect} />
      </div>
    );
  }

  if (state.step === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-red-600">{state.message}</p>
        <button
          onClick={onRetry}
          className="rounded-full bg-gray-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    );
  }

  // idle — should not show in dialog, but handle gracefully
  return null;
}

function DisconnectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
    >
      <Unplug className="size-4" />
      Disconnect
    </button>
  );
}
