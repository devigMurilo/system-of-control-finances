import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Configurações</h1>
      <Card className="p-5">
        <p className="font-semibold">{user.name ?? "Usuário"}</p>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </Card>
    </AppShell>
  );
}
