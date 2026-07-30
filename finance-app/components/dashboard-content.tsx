"use client";

import { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-number";
import { getCategoryEmoji, getCategoryColor, brl } from "@/lib/format";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { EmptyState } from "@/components/empty-state";
import {
  DonutChart,
  BarChart,
  MonthComparison,
  FinancialHealth,
  TopExpenses,
} from "@/components/charts";

type AccountSummary = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balances: { current: string; available: string | null }[];
};

type TransactionSummary = {
  id: string;
  description: string;
  amount: string;
  type: string;
  date: Date;
  category: { name: string } | null;
};

type Props = {
  accounts: AccountSummary[];
  transactions: TransactionSummary[];
  userName: string;
  userEmail: string;
};

export function DashboardContent({
  accounts,
  transactions,
  userName,
  userEmail,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const hasData = accounts.length > 0 || transactions.length > 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const { balance, income, expenses, monthIncome, monthExpenses, prevMonthIncome, prevMonthExpenses, categoryData, monthlyData } = useMemo(() => {
    const balance = accounts.reduce(
      (sum, a) => sum + Number(a.balances[0]?.current ?? 0),
      0
    );
    const income = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = Math.abs(
      transactions
        .filter((t) => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)
    );

    // Current month transactions
    const thisMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthIncome = thisMonthTxs
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    const monthExpenses = Math.abs(
      thisMonthTxs
        .filter((t) => Number(t.amount) < 0)
        .reduce((s, t) => s + Number(t.amount), 0)
    );

    // Previous month transactions
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
    const prevMonthIncome = prevMonthTxs
      .filter((t) => Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    const prevMonthExpenses = Math.abs(
      prevMonthTxs
        .filter((t) => Number(t.amount) < 0)
        .reduce((s, t) => s + Number(t.amount), 0)
    );

    // Category breakdown (current month expenses)
    const catMap = new Map<string, number>();
    for (const t of thisMonthTxs) {
      if (Number(t.amount) < 0) {
        const name = t.category?.name ?? "Outros";
        catMap.set(name, (catMap.get(name) ?? 0) + Math.abs(Number(t.amount)));
      }
    }
    const categoryData = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly evolution (last 6 months)
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const m = currentMonth - i;
      const y = currentYear + (m < 0 ? -1 : 0);
      const monthIdx = ((m % 12) + 12) % 12;
      const year = m < 0 ? currentYear - 1 : currentYear;
      const key = `${monthIdx}-${year}`;
      monthlyMap.set(key, { income: 0, expense: 0 });
    }
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getMonth()}-${d.getFullYear()}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        if (Number(t.amount) > 0) entry.income += Number(t.amount);
        else entry.expense += Math.abs(Number(t.amount));
      }
    }
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];
    const monthlyData = Array.from(monthlyMap.entries()).map(([key, v]) => {
      const monthIdx = parseInt(key.split("-")[0]);
      return { label: monthNames[monthIdx], ...v };
    });

    return {
      balance,
      income,
      expenses,
      monthIncome,
      monthExpenses,
      prevMonthIncome,
      prevMonthExpenses,
      categoryData,
      monthlyData,
    };
  }, [accounts, transactions, currentMonth, currentYear]);

  const fadeClass = (stagger: string) =>
    visible ? `animate-fade-in-up opacity-100 ${stagger}` : "opacity-0";

  if (!hasData) {
    return (
      <div className="mb-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-500">Olá, {userName ?? userEmail}</p>
          </div>
          <ConnectBankButton />
        </div>
        <EmptyState
          title="Nenhuma conta conectada"
          description="Conecte seu banco para começar a acompanhar suas finanças em tempo real."
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${fadeClass("stagger-1")}`}
      >
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Olá, {userName ?? userEmail}</p>
        </div>
        <ConnectBankButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={`${fadeClass("stagger-2")} border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5`}
        >
          <p className="text-sm font-medium text-emerald-700">Saldo</p>
          <strong className="mt-2 block text-3xl text-emerald-900">
            <AnimatedNumber value={balance} formatFn={brl} />
          </strong>
        </Card>

        <Card className={`${fadeClass("stagger-3")} p-5`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Receitas</p>
            <MonthComparison
              current={monthIncome}
              previous={prevMonthIncome}
              label="receitas"
            />
          </div>
          <strong className="mt-2 block text-2xl text-emerald-700">
            <AnimatedNumber value={monthIncome} formatFn={brl} />
          </strong>
          <p className="mt-1 text-xs text-slate-400">este mês</p>
        </Card>

        <Card className={`${fadeClass("stagger-4")} p-5`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Despesas</p>
            <MonthComparison
              current={monthExpenses}
              previous={prevMonthExpenses}
              label="despesas"
              invert
            />
          </div>
          <strong className="mt-2 block text-2xl text-red-600">
            <AnimatedNumber value={monthExpenses} formatFn={brl} />
          </strong>
          <p className="mt-1 text-xs text-slate-400">este mês</p>
        </Card>
      </div>

      {transactions.length === 0 && (
        <div className={`${fadeClass("stagger-5")} mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700`}>
          Sincronizando transações... Os dados podem levar alguns minutos para aparecer.
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className={`${fadeClass("stagger-5")} p-5 lg:col-span-2`}>
          <h2 className="mb-3 font-semibold">Gastos por categoria</h2>
          {categoryData.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Nenhum gasto neste mês
            </p>
          ) : (
            <DonutChart
              data={categoryData}
              total={categoryData.reduce((s, c) => s + c.value, 0)}
            />
          )}
        </Card>

        <Card className={`${fadeClass("stagger-5")}`}>
          <FinancialHealth spent={monthExpenses} income={monthIncome} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className={`${fadeClass("stagger-6")} p-5`}>
          <h2 className="mb-3 font-semibold">Evolução mensal</h2>
          <BarChart data={monthlyData} formatFn={brl} />
        </Card>

        <Card className={`${fadeClass("stagger-6")} p-5`}>
          <h2 className="mb-3 font-semibold">Maiores gastos do mês</h2>
          <TopExpenses
            transactions={transactions.filter((t) => {
              const d = new Date(t.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })}
            formatFn={brl}
          />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className={`${fadeClass("stagger-5")} p-5`}>
          <h2 className="font-semibold">Categorias</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {transactions.length === 0 && (
              <p className="py-4 text-center text-slate-400">
                Nenhuma transação ainda
              </p>
            )}
            {groupCategories(transactions).map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
              >
                <span className={`rounded px-2 py-0.5 ${getCategoryColor(cat.name)}`}>
                  {getCategoryEmoji(cat.name)} {cat.name}
                </span>
                <span className="font-medium">{brl(cat.total)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={`${fadeClass("stagger-6")} p-5`}>
          <h2 className="font-semibold">Últimas transações</h2>
          <div className="mt-4 divide-y divide-border">
            {transactions.length === 0 && (
              <p className="py-6 text-sm text-slate-500">
                Nenhuma transação sincronizada.
              </p>
            )}
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3 text-sm transition-all hover:pl-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {getCategoryEmoji(transaction.category?.name ?? null)}
                  </span>
                  <span>{transaction.description}</span>
                </div>
                <strong
                  className={
                    Number(transaction.amount) > 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }
                >
                  {brl(Number(transaction.amount))}
                </strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function groupCategories(transactions: TransactionSummary[]) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    const name = t.category?.name ?? "Outros";
    map.set(name, (map.get(name) ?? 0) + Number(t.amount));
  }
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}
