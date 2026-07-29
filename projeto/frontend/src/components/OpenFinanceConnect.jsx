import { CalendarDays, Landmark, Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  createConnectToken,
  createOpenFinanceStatement,
  getOpenFinanceStatement,
} from "../api.js";

export default function OpenFinanceConnect() {
  const [connectToken, setConnectToken] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [statementStatus, setStatementStatus] = useState("idle");
  const [statementMessage, setStatementMessage] = useState("");
  const [protocol, setProtocol] = useState("");
  const [statementResult, setStatementResult] = useState(null);
  const [form, setForm] = useState({
    account_hash: "",
    payer_cpf_cnpj: "",
    date_start: "",
    date_end: "",
    today: false,
  });

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

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateStatement(event) {
    event.preventDefault();
    setStatementStatus("loading");
    setStatementMessage("");
    setStatementResult(null);

    const payload = {
      account_hash: form.account_hash,
      payer_cpf_cnpj: form.payer_cpf_cnpj,
      today: form.today,
    };

    if (!form.today) {
      payload.date_start = form.date_start;
      payload.date_end = form.date_end;
    }

    try {
      const data = await createOpenFinanceStatement(payload);
      const uniqueId = data.uniqueId || data.unique_id || "";

      setProtocol(uniqueId);
      setStatementResult(data);
      setStatementStatus("success");
      setStatementMessage(uniqueId ? `Protocolo gerado: ${uniqueId}` : "Protocolo gerado.");
    } catch (err) {
      setStatementStatus("error");
      setStatementMessage(err.message);
    }
  }

  async function handleFetchStatement() {
    setStatementStatus("loading");
    setStatementMessage("");

    try {
      const data = await getOpenFinanceStatement(protocol, form.payer_cpf_cnpj);
      setStatementResult(data);
      setStatementStatus("success");
      setStatementMessage("Extrato consultado com sucesso.");
    } catch (err) {
      setStatementStatus("error");
      setStatementMessage(err.message);
    }
  }

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

        {connectToken && <div className="inline-success">Conexao Pluggy preparada.</div>}

        {status === "success" && message && <div className="inline-success">{message}</div>}

        <form className="open-finance-form" onSubmit={handleCreateStatement}>
          <label>
            CPF/CNPJ do pagador
            <input
              name="payer_cpf_cnpj"
              onChange={updateField}
              placeholder="00000000000191"
              required
              value={form.payer_cpf_cnpj}
            />
          </label>

          <label>
            Account Hash
            <input
              name="account_hash"
              onChange={updateField}
              placeholder="hash da conta TecnoSpeed"
              required
              value={form.account_hash}
            />
          </label>

          <div className="date-grid">
            <label>
              Inicio
              <input
                disabled={form.today}
                name="date_start"
                onChange={updateField}
                required={!form.today}
                type="date"
                value={form.date_start}
              />
            </label>
            <label>
              Fim
              <input
                disabled={form.today}
                name="date_end"
                onChange={updateField}
                required={!form.today}
                type="date"
                value={form.date_end}
              />
            </label>
          </div>

          <label className="checkbox-row">
            <input checked={form.today} name="today" onChange={updateField} type="checkbox" />
            Somente hoje
          </label>

          <button disabled={statementStatus === "loading"} type="submit">
            <CalendarDays size={16} />
            {statementStatus === "loading" ? "Solicitando" : "Solicitar extrato"}
          </button>
        </form>

        <div className="protocol-row">
          <input
            onChange={(event) => setProtocol(event.target.value)}
            placeholder="uniqueId do protocolo"
            value={protocol}
          />
          <button
            disabled={!protocol || !form.payer_cpf_cnpj || statementStatus === "loading"}
            onClick={handleFetchStatement}
            type="button"
          >
            <Search size={16} />
            Consultar
          </button>
        </div>

        {statementStatus === "error" && <div className="inline-alert">{statementMessage}</div>}
        {statementStatus === "success" && statementMessage && (
          <div className="inline-success">{statementMessage}</div>
        )}

        {statementResult && (
          <pre className="statement-result">{JSON.stringify(statementResult, null, 2)}</pre>
        )}
      </div>
    </section>
  );
}
