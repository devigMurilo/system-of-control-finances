import { PluggyConnect } from "react-pluggy-connect";
import { Landmark } from "lucide-react";
import { useEffect, useState } from "react";

import { createConnectToken } from "../api.js";

export default function OpenFinanceConnect() {
  const [connectToken, setConnectToken] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadConnectToken() {
      try {
        const data = await createConnectToken();

        if (isMounted) {
          setConnectToken(data.accessToken);
          setStatus("ready");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setMessage(err.message);
        }
      }
    }

    loadConnectToken();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="panel open-finance-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <Landmark size={18} />
          <h2>Open Finance</h2>
        </div>
        <span className={`status-pill ${status}`}>
          {status === "ready" ? "Pronto" : status === "error" ? "Erro" : "Carregando"}
        </span>
      </div>

      <div className="open-finance-body">
        {status === "loading" && <p className="muted-text">Preparando conexao segura...</p>}

        {status === "error" && <div className="inline-alert">{message}</div>}

        {connectToken && (
          <PluggyConnect
            connectToken={connectToken}
            includeSandbox
            onSuccess={(itemData) => {
              setStatus("success");
              setMessage(`Conta conectada: ${itemData.item.id}`);
            }}
            onError={(error) => {
              setStatus("error");
              setMessage(error?.message || "Falha ao conectar conta.");
            }}
          />
        )}

        {status === "success" && <div className="inline-success">{message}</div>}
      </div>
    </section>
  );
}
