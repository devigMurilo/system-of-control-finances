import { AppShell } from "@/components/app-shell";
import { CardSkeleton, TransactionSkeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-1 h-6 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-2 h-8 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 h-4 w-28 animate-pulse rounded bg-slate-200" />
            {Array.from({ length: 5 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
