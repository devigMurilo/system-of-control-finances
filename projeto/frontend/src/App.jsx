import { RefreshCcw, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAccounts, getDashboard, getTransactions } from "./api.js";
import AccountsList from "./components/AccountsList.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import OpenFinanceConnect from "./components/OpenFinanceConnect.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import TransactionsTable from "./components/TransactionsTable.jsx";
import { formatCurrency } from "./formatters.js";

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardData, accountData, transactionData] = await Promise.all([
        getDashboard(),
        getAccounts(),
        getTransactions(),
      ]);

      setDashboard(dashboardData);
      setAccounts(accountData);
      setTransactions(transactionData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cards = useMemo(
    () => [
      {
        label: "Saldo total",
        value: formatCurrency(dashboard?.total_balance),
        icon: WalletCards,
        tone: "neutral",
      },
      {
        label: "Receitas",
        value: formatCurrency(dashboard?.total_income),
        icon: TrendingUp,
        tone: "good",
      },
      {
        label: "Despesas",
        value: formatCurrency(dashboard?.total_expenses),
        icon: TrendingDown,
        tone: "bad",
      },
    ],
    [dashboard],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sistema de controle financeiro</p>
          <h1>Controle Financeiro</h1>
        </div>
        <button type="button" onClick={loadData} disabled={loading}>
          <RefreshCcw size={16} />
          {loading ? "Atualizando" : "Atualizar"}
        </button>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="summary-grid">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      {loading ? (
        <section className="panel empty-panel">Carregando dados financeiros...</section>
      ) : (
        <div className="content-grid">
          <div className="side-column">
            <OpenFinanceConnect />
            <AccountsList accounts={accounts} />
          </div>
          <div className="main-column">
            <CategoryChart categories={dashboard?.expenses_by_category || []} />
            <TransactionsTable transactions={transactions} />
          </div>
        </div>
      )}
    </main>
  );
}
