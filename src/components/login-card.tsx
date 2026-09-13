"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const inviteTokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteTokenValue = searchParams.get("invite") ?? "";
  const inviteToken = inviteTokenPattern.test(inviteTokenValue) ? inviteTokenValue : null;
  const [mode, setMode] = useState<"login" | "signup">(inviteToken ? "signup" : "login");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(searchParams.get("error") ? "Não foi possível confirmar o acesso. Tente novamente." : "");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setMessage("");
      setSuccess(false);
      const supabase = createClient();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setMessage("E-mail ou senha inválidos.");
        router.replace("/");
        router.refresh();
        return;
      }

      const fullName = String(formData.get("full_name") ?? "").trim();
      const clinicName = String(formData.get("clinic_name") ?? "").trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: inviteToken
            ? { full_name: fullName, invite_token: inviteToken }
            : { full_name: fullName, clinic_name: clinicName },
        },
      });

      if (error) {
        return setMessage(error.message === "User already registered" ? "Este e-mail já possui uma conta." : "Não foi possível criar a conta. Revise os dados.");
      }
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setSuccess(true);
        setMessage(inviteToken ? "Enviamos a confirmação para o seu e-mail. Depois de confirmar, você terá acesso à clínica." : "Enviamos a confirmação para o seu e-mail. Depois de confirmar, sua clínica será criada automaticamente.");
      }
    });
  }

  const signupTitle = inviteToken ? "Aceite seu convite para o Odonto" : "Comece com uma clínica organizada";
  const signupDescription = inviteToken ? "Crie seu acesso individual para revisar a operação com segurança." : "Crie o acesso do responsável. A equipe poderá ser convidada depois.";

  return (
    <div className="w-full max-w-[430px] rounded-[26px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(10,36,29,.18)] backdrop-blur sm:p-8">
      {!inviteToken ? (
        <div className="mb-7 flex rounded-xl bg-[#eef2f0] p-1" role="tablist" aria-label="Tipo de acesso">
          {(["login", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              onClick={() => {
                setMode(item);
                setMessage("");
                setSuccess(false);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === item ? "bg-white text-[#17201d] shadow-sm" : "text-[#71807b]"}`}
            >
              {item === "login" ? "Entrar" : "Criar clínica"}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          Convite de revisão · acesso individual
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176b55]">Ambiente seguro</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{mode === "login" ? "Bem-vindo de volta" : signupTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b77]">{mode === "login" ? "Acesse agenda, pacientes e operação clínica em um único fluxo." : signupDescription}</p>
      </div>

      <form action={submit} className="mt-7 space-y-4">
        {mode === "signup" ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Seu nome</span>
              <input name="full_name" minLength={2} required autoComplete="name" className="auth-input" placeholder="Nome completo" />
            </label>
            {!inviteToken ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Nome da clínica</span>
                <input name="clinic_name" minLength={2} maxLength={120} required autoComplete="organization" className="auth-input" placeholder="Clínica Odonto" />
              </label>
            ) : null}
          </>
        ) : null}

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#52605b]">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="auth-input" placeholder="voce@clinica.com.br" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Senha</span>
          <span className="relative block">
            <input name="password" type={visible ? "text" : "password"} minLength={8} required autoComplete={mode === "login" ? "current-password" : "new-password"} className="auth-input pr-11" placeholder="Mínimo de 8 caracteres" />
            <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78837f]" aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>

        {message ? <div className={`flex gap-2 rounded-xl border p-3 text-xs leading-5 ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{success ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : null}<span>{message}</span></div> : null}

        <button disabled={pending || success} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#176b55] text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f513f] disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? <LoaderCircle className="animate-spin" size={18} /> : <>{mode === "login" ? "Entrar no Odonto" : inviteToken ? "Criar acesso de revisão" : "Criar meu acesso"}<ArrowRight size={17} /></>}
        </button>
      </form>
      <p className="mt-5 text-center text-[11px] leading-5 text-[#8a9490]">Dados clínicos protegidos por isolamento de clínica e políticas de acesso no banco.</p>
    </div>
  );
}
