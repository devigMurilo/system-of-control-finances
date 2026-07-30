"use client";

import { useState, useMemo } from "react";
import { Filter, Search, X } from "lucide-react";
import { brl, getCategoryEmoji, groupByDate } from "@/lib/format";

type Transaction = {
  id: string;
  description: string;
  amount: string;
  type: string;
  date: Date;
  accountId: string;
  account: { id: string; name: string };
  category: { name: string } | null;
};

type Account = {
  id: string;
  name: string;
};

const DATE_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "Este mês", days: null },
  { label: "Todas", days: -1 },
] as const;

type Props = {
  transactions: Transaction[];
  accounts: Account[];
};

export function TransactionsFilter({ transactions, accounts }: Props) {
  const [dateDays, setDateDays] = useState<number>(-1);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = transactions;

    const now = new Date();
    if (dateDays === 0) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter((t) => new Date(t.date) >= start);
    } else if (dateDays > 0) {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - dateDays);
      list = list.filter((t) => new Date(t.date) >= cutoff);
    }

    if (selectedAccounts.length > 0) {
      list = list.filter((t) => selectedAccounts.includes(t.accountId));
    }

    if (minValue !== "") {
      const min = Number(minValue);
      list = list.filter((t) => Math.abs(Number(t.amount)) >= min);
    }
    if (maxValue !== "") {
      const max = Number(maxValue);
      list = list.filter((t) => Math.abs(Number(t.amount)) <= max);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category?.name?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [transactions, dateDays, selectedAccounts, minValue, maxValue, search]);

  const groups = groupByDate(filtered);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const hasActiveFilters =
    dateDays !== -1 ||
    selectedAccounts.length > 0 ||
    minValue !== "" ||
    maxValue !== "" ||
    search !== "";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Filter size={15} />
          Filtros
          {hasActiveFilters && (
            <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
              {(dateDays !== -1 ? 1 : 0) +
                (selectedAccounts.length > 0 ? 1 : 0) +
                (minValue !== "" || maxValue !== "" ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-slate-500">
                Período
              </p>
              <div className="flex flex-wrap gap-1">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setDateDays(preset.days ?? 0)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      dateDays === (preset.days ?? 0)
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-slate-500">
                Conta
              </p>
              <div className="flex flex-wrap gap-1">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      selectedAccounts.includes(acc.id)
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-slate-500">
                Valor
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Mín"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-20 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400">—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-20 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setDateDays(-1);
                  setSelectedAccounts([]);
                  setMinValue("");
                  setMaxValue("");
                  setSearch("");
                }}
                className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <X size={13} />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      <p className="mb-3 text-xs text-slate-400">
        {filtered.length} de {transactions.length} transações
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-12 text-center">
          <p className="text-sm text-slate-500">
            Nenhuma transação encontrada com esses filtros.
          </p>
          <button
            onClick={() => {
              setDateDays(-1);
              setSelectedAccounts([]);
              setMinValue("");
              setMaxValue("");
              setSearch("");
            }}
            className="mt-2 text-sm text-emerald-600 hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {Array.from(groups.entries()).map(([label, txns]) => (
            <div key={label}>
              <div className="bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </div>
              {txns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getCategoryEmoji(txn.category?.name ?? null)}
                    </span>
                    <div>
                      <p className="font-medium">{txn.description}</p>
                      <p className="text-xs text-slate-400">
                        {txn.account.name}
                      </p>
                    </div>
                  </div>
                  <strong
                    className={
                      Number(txn.amount) > 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }
                  >
                    {brl(Number(txn.amount))}
                  </strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
