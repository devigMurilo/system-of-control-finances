import { Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary text-white">
            <Banknote size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Finance App</h1>
            <p className="text-sm text-slate-500">Acesse seu controle financeiro</p>
          </div>
        </div>
        <LoginForm />
      </Card>
    </main>
  );
}
