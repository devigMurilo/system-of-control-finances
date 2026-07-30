"use client";

import { Landmark, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { PluggyConnect as PluggyConnectType } from "react-pluggy-connect";
import type { Item } from "pluggy-sdk";
import { Button } from "@/components/ui/button";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
) as typeof PluggyConnectType;

export function ConnectBankButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [connectToken, setConnectToken] = useState<string>();
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const generateToken = useCallback(async () => {
    setMessage("");

    try {
      const response = await fetch("/api/pluggy/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: process.env.NEXT_PUBLIC_PLUGGY_WEBHOOK_URL,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao gerar token de conexão");
      }

      setConnectToken(data.accessToken);
      setConnecting(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao conectar banco"
      );
    }
  }, []);

  const onSuccess = useCallback(async (itemData: { item: Item }) => {
    const itemId = itemData.item.id;

    setMessage("Sincronizando...");
    setSyncing(true);

    try {
      const response = await fetch("/api/pluggy/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          connectorId: itemData.item.connector?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Erro ao salvar conexão");
      }

      setMessage("Banco conectado com sucesso.");
      setSyncing(false);
      setConnecting(false);
      setConnectToken(undefined);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao salvar conexão"
      );
      setSyncing(false);
      setConnecting(false);
      setConnectToken(undefined);
    }
  }, [router]);

  const onError = useCallback(
    (error: { message: string; data?: { item?: Item } }) => {
      setMessage(error.message || "Erro na conexão bancária.");
      setConnecting(false);
      setConnectToken(undefined);
    },
    []
  );

  const onClose = useCallback(() => {
    setConnecting(false);
    setConnectToken(undefined);
  }, []);

  const isBusy = connecting || syncing;

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {message && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            {syncing && <Loader2 size={14} className="animate-spin" />}
            {message}
          </p>
        )}
        <Button type="button" onClick={generateToken} disabled={isBusy}>
          {syncing ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Landmark size={17} />
          )}
          {connecting ? "Conectando..." : syncing ? "Sincronizando..." : "Conectar banco"}
        </Button>
      </div>

      {connecting && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox
          onSuccess={onSuccess}
          onError={onError}
          onClose={onClose}
        />
      )}
    </>
  );
}
