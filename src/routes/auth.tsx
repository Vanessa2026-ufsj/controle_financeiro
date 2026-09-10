import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acessar o sistema | Patrimônio UFSJ" },
      {
        name: "description",
        content:
          "Acesse o sistema de controle patrimonial do Setor de Materiais da UFSJ com e-mail e senha.",
      },
      { property: "og:title", content: "Acessar o sistema | Patrimônio UFSJ" },
      {
        property: "og:description",
        content: "Área restrita do controle patrimonial do Setor de Materiais da UFSJ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/painel", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome },
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/painel", replace: true });
        } else {
          setAguardandoConfirmacao(true);
        }
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível continuar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Universidade Federal de São João del-Rei
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-foreground">
            Controle Patrimonial
          </h1>
          <p className="text-sm text-muted-foreground">Setor de Materiais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{modo === "entrar" ? "Acessar o sistema" : "Criar conta"}</CardTitle>
            <CardDescription>
              {modo === "entrar"
                ? "Informe seu e-mail institucional e senha."
                : "O primeiro cadastro do sistema recebe o perfil de administrador."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aguardandoConfirmacao ? (
              <div className="space-y-4 text-sm">
                <p>
                  Enviamos um e-mail de confirmação para <strong>{email}</strong>. Clique no link
                  recebido para ativar o acesso.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAguardandoConfirmacao(false);
                    setModo("entrar");
                  }}
                >
                  Voltar para o acesso
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={enviar}>
                {modo === "criar" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!aguardandoConfirmacao ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {modo === "entrar" ? "Ainda não tem acesso?" : "Já possui acesso?"}{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
            >
              {modo === "entrar" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            Voltar à página inicial
          </Link>
        </p>
      </div>
    </div>
  );
}
