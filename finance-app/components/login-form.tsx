"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Use pelo menos 6 caracteres")
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      setError("Não foi possível autenticar com esses dados.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {mode === "register" && <Input placeholder="Nome" {...register("name")} />}
      <Input placeholder="E-mail" type="email" {...register("email")} />
      <Input placeholder="Senha" type="password" {...register("password")} />
      {formState.errors.email && (
        <p className="text-sm text-red-600">{formState.errors.email.message}</p>
      )}
      {formState.errors.password && (
        <p className="text-sm text-red-600">{formState.errors.password.message}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button disabled={formState.isSubmitting}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </Button>
      <button
        type="button"
        className="text-sm font-medium text-primary"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Criar uma conta" : "Já tenho conta"}
      </button>
    </form>
  );
}
