import { CalendarDays, Landmark, Search, Unplug } from "lucide-react";
import { useState } from "react";
import { PluggyConnect } from "react-pluggy-connect";

import {
  createConnectToken,
  createOpenFinanceStatement,
  getOpenFinanceStatement,
} from "../api.js";

export default function OpenFinanceConnect() {
  const [connectStatus, setConnectStatus] = useState("idle");
  const [connectMessage, setConnectMessage] = useState("");
  const [connectToken, setConnectToken] = useState("");
  const [pluggyResult, setPluggyResult] = useState(null);
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

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleConnectPluggy() {
    if (!form.payer_cpf_cnpj) {
      setConnectStatus("error");
      setConnectMessage("Informe o CPF/CNPJ do pagador primeiro.");
      return;
    }

    setConnectStatus("loading");
    setConnectMessage("");
    setConnectToken("");

    try {
      const data = await createConnectToken(form.payer_cpf_cnpj);
      setConnectToken(data.connectToken);
      setConnectStatus("open");
    } catch (err) {
      setConnectStatus("error");
      setConnectMessage(err.message);
    }
  }

  function handlePluggySuccess(result) {
    setPluggyResult(result);
    const itemId = result?.item?.id || result?.id || result?.itemId || "";
    if (itemId) {
      setForm((current) => ({ ...current, account_hash: itemId }));
      setConnectToken("");
      setConnectStatus("success");
      setConnectMessage("Conta conectada com sucesso via Pluggy!");
    } else {
      setConnectStatus("success");
      setConnectMessage("Conectado. Retorno: " + JSON.stringify(result));
    }
  }

  function handlePluggyError(error) {
    setPluggyResult(error);
    setConnectToken("");
    setConnectStatus("error");
    setConnectMessage(error.message || "Erro ao conectar conta via Pluggy.");
  }

  function handlePluggyClose() {
    setConnectToken("");
    setPluggyResult(null);
    if (connectStatus === "open") {
      setConnectStatus("ready");
    }
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

  function statusLabel() {
    switch (connectStatus) {
      case "open": return "Aberto";
      case "ready": return "Pronto";
      case "success": return "Conectado";
      case "error": return "Erro";
      case "loading": return "Carregando";
      default: return "Inativo";
    }
  }

  function statusClass() {
    switch (connectStatus) {
      case "ready":
      case "success":
        return "ready";
      case "error":
        return "error";
      default:
        return "idle";
    }
  }

  return (
    <section className="panel open-finance-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <Landmark size={18} />
          <h2>Open Finance</h2>
        </div>
        <span className={`status-pill ${statusClass()}`}>{statusLabel()}</span>
      </div>

      <div className="open-finance-body">
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

          <button
            disabled={connectStatus === "loading" || connectStatus === "open"}
            onClick={handleConnectPluggy}
            type="button"
          >
            <Unplug size={16} />
            {connectStatus === "loading" ? "Conectando..." : "Conectar conta via Pluggy"}
          </button>

          {connectToken && (
            <PluggyConnect
              connectToken={connectToken}
              includeSandbox
              openFinanceParameters={{ cpf: form.payer_cpf_cnpj.length <= 11 ? form.payer_cpf_cnpj : undefined, cnpj: form.payer_cpf_cnpj.length > 11 ? form.payer_cpf_cnpj : undefined }}
              onSuccess={handlePluggySuccess}
              onError={handlePluggyError}
              onClose={handlePluggyClose}
            />
          )}

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

        {connectStatus === "error" && <div className="inline-alert">{connectMessage}</div>}
        {connectStatus === "success" && <div className="inline-success">{connectMessage}</div>}
        {(connectStatus === "loading") && <p className="muted-text">Gerando token de conexao...</p>}
        {pluggyResult && <pre className="statement-result">Pluggy callback: {JSON.stringify(pluggyResult, null, 2)}</pre>}

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
