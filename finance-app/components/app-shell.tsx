import Link from "next/link";
import { Banknote, LayoutDashboard, List, Settings, Wallet } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: List },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/settings", label: "Configurações", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white p-5 md:block">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-white">
            <Banknote size={18} />
          </span>
          Finance App
        </Link>
        <nav className="mt-8 grid gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-muted"
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
