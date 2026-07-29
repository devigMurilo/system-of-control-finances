"use client";

import { Landmark } from "lucide-react";
import { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    belvoSDK?: {
      createWidget: (
        accessToken: string,
        config: {
          callback: (link: string, institution: string) => void;
          onExit?: (data: unknown) => void;
          onEvent?: (data: unknown) => void;
        }
      ) => { build: () => void };
    };
  }
}

export function ConnectBankButton() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  async function saveBelvoLink(linkId: string, institution: string) {
    const response = await fetch("/api/belvo/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, institution })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Não foi possível salvar o link da Belvo.");
    }
  }

  async function connect() {
    setMessage("");

    if (!window.belvoSDK || !isScriptReady) {
      setMessage("Widget da Belvo ainda está carregando.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/belvo/token", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível iniciar a Belvo.");
      }

      window.belvoSDK
        .createWidget(data.accessToken, {
          callback: async (link, institution) => {
            await saveBelvoLink(link, institution);
            setMessage("Banco conectado com sucesso.");
          },
          onExit: () => {
            setMessage("Conexão cancelada.");
          },
          onEvent: (data) => {
            console.info("Belvo widget event", data);
          }
        })
        .build();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao conectar banco.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://cdn.belvo.io/belvo-widget-1-stable.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
      />
      <div id="belvo" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {message && <p className="text-sm text-slate-500">{message}</p>}
        <Button type="button" onClick={connect} disabled={isLoading || !isScriptReady}>
          <Landmark size={17} />
          {isLoading ? "Conectando..." : "Conectar banco"}
        </Button>
      </div>
    </>
  );
}
