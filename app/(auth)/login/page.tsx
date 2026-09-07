"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Credenciais inválidas ou conta inativa.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div>
            <CardTitle>SPO Gestão</CardTitle>
            <p className="text-sm text-slate-500">Acesso interno — Serviços de Psicologia e Orientação</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" aria-label="Iniciar sessão">
            <div>
              <Label htmlFor="email">Email institucional</Label>
              <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Palavra-passe</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <FieldError message={error ?? undefined} />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "A entrar…" : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            Sem conta? Peça acesso à equipa SPO. Em situação urgente, ligue 112 ou SNS 24 — esta aplicação não é um canal de emergência.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
