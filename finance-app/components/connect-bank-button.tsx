"use client";

import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectBankButton() {
  async function connect() {
    const response = await fetch("/api/belvo/connect", { method: "POST" });
    const data = await response.json();
    alert(`Link Belvo criado: ${data.linkId}. Configure o widget da Belvo aqui.`);
  }

  return (
    <Button onClick={connect}>
      <Landmark size={17} />
      Conectar banco
    </Button>
  );
}
