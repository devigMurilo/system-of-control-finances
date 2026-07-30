"use client";

type Slice = {
  name: string;
  value: number;
  color: string;
};

const COLORS = [
  "#f97316", "#3b82f6", "#eab308", "#a855f7",
  "#ef4444", "#14b8a6", "#6366f1", "#ec4899",
  "#84cc16", "#06b6d4", "#f43f5e", "#8b5cf6",
];

export function DonutChart({
  data,
  total,
}: {
  data: { name: string; value: number }[];
  total: number;
}) {
  const totalVal = total || data.reduce((s, d) => s + Math.abs(d.value), 0);
  if (totalVal === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-400">
        Nenhum gasto no período
      </div>
    );
  }

  const slices: Slice[] = data.map((d, i) => ({
    name: d.name,
    value: Math.abs(d.value),
    color: COLORS[i % COLORS.length],
  }));

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const paths = sorted.map((slice) => {
    const fraction = slice.value / totalVal;
    const strokeLen = fraction * circumference;
    const dasharray = `${strokeLen} ${circumference - strokeLen}`;
    const dashoffset = -offset;
    offset += strokeLen;
    return { ...slice, dasharray, dashoffset, fraction };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="150" height="150" viewBox="0 0 150 150" className="shrink-0">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="28" />
        {paths.map((slice) => (
          <circle
            key={slice.name}
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth="28"
            strokeDasharray={slice.dasharray}
            strokeDashoffset={slice.dashoffset}
            transform="rotate(-90 75 75)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        ))}
        <text x="75" y="72" textAnchor="middle" className="fill-slate-900 text-sm font-bold">
          {total > 999 ? `${(total / 1000).toFixed(0)}k` : total.toFixed(0)}
        </text>
        <text x="75" y="88" textAnchor="middle" className="fill-slate-500 text-[10px]">
          total
        </text>
      </svg>
      <div className="grid gap-1.5 text-xs">
        {paths.slice(0, 6).map((slice) => (
          <div key={slice.name} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-slate-600">{slice.name}</span>
            <span className="text-slate-900 font-medium">
              {(slice.fraction * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  formatFn,
}: {
  data: { label: string; income: number; expense: number }[];
  formatFn: (v: number) => string;
}) {
  const allValues = data.flatMap((d) => [d.income, d.expense]);
  const maxVal = Math.max(...allValues, 1);

  return (
    <div className="grid gap-3">
      {data.map((bar) => {
        const incomeH = (bar.income / maxVal) * 120;
        const expenseH = (bar.expense / maxVal) * 120;
        return (
          <div key={bar.label} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2 text-xs">
            <span className="text-slate-500 text-right">{bar.label}</span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${(bar.income / maxVal) * 100}%` }}
                />
                <span className="text-emerald-700 font-medium w-16 text-left">
                  {formatFn(bar.income)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <div
                  className="h-2 rounded-full bg-red-400 transition-all"
                  style={{ width: `${(bar.expense / maxVal) * 100}%` }}
                />
                <span className="text-red-600 font-medium w-16 text-left">
                  {formatFn(bar.expense)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthComparison({
  current,
  previous,
  label,
  invert,
}: {
  current: number;
  previous: number;
  label: string;
  invert?: boolean;
}) {
  if (previous === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct > 0;
  const absPct = Math.abs(pct).toFixed(0);

  if (invert) {
    // For expenses: going up is bad (red), going down is good (green)
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-medium ${
          pct <= 0 ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {pct <= 0 ? "↓" : "↑"} {absPct}%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isPositive ? "↑" : "↓"} {absPct}%
    </span>
  );
}

export function FinancialHealth({
  spent,
  income,
}: {
  spent: number;
  income: number;
}) {
  if (income === 0) return null;

  const pct = Math.min((spent / income) * 100, 100);
  const color =
    pct < 50
      ? "bg-emerald-500"
      : pct < 75
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">
        Saúde financeira
      </p>
      <p className="mt-1 text-2xl font-bold">
        {pct.toFixed(0)}%
      </p>
      <p className="text-xs text-slate-500">
        da sua renda já foi comprometida
      </p>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>Gasto: R$ {spent.toFixed(0)}</span>
        <span>Renda: R$ {income.toFixed(0)}</span>
      </div>
    </div>
  );
}

export function TopExpenses({
  transactions,
  formatFn,
}: {
  transactions: { id: string; description: string; amount: string; category?: { name: string } | null; date: Date }[];
  formatFn: (v: number) => string;
}) {
  const top = [...transactions]
    .filter((t) => Number(t.amount) < 0)
    .sort((a, b) => Number(a.amount) - Number(b.amount))
    .slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-400">
        Nenhuma despesa no período
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {top.map((txn, i) => (
        <div
          key={txn.id}
          className="flex items-center justify-between py-2.5 text-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{txn.description}</p>
              {txn.category && (
                <p className="text-xs text-slate-400">{txn.category.name}</p>
              )}
            </div>
          </div>
          <strong className="text-red-600">
            {formatFn(Math.abs(Number(txn.amount)))}
          </strong>
        </div>
      ))}
    </div>
  );
}
