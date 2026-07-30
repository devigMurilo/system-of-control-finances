"use client";

import { Landmark } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { PluggyConnect as PluggyConnectType } from "react-pluggy-connect";
import type { Item } from "pluggy-sdk";
import { Button } from "@/components/ui/button";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
) as typeof PluggyConnectType;

export function ConnectBankButton() {
  const [message, setMessage] = useState("");
  const [connectToken, setConnectToken] = useState<string>();
  const [connecting, setConnecting] = useState(false);

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
    setConnecting(false);
    setConnectToken(undefined);
  }, []);

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

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {message && <p className="text-sm text-slate-500">{message}</p>}
        <Button
          type="button"
          onClick={generateToken}
          disabled={connecting}
        >
          <Landmark size={17} />
          {connecting ? "Conectando..." : "Conectar banco"}
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
