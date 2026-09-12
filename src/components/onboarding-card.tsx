"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function OnboardingCard({ userName }: { userName: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setError("");
      const clinicName = String(formData.get("clinic_name") ?? "").trim();
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ data: { clinic_name: clinicName } });
      if (updateError) return setError("Não foi possível criar a clínica agora. Tente novamente.");
      router.replace("/");
      router.refresh();
    });
  }

  return <div className="w-full max-w-lg rounded-[28px] border border-[#dce2df] bg-white p-7 shadow-[0_25px_80px_rgba(23,32,29,.1)] sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f3ef] text-[#176b55]"><Building2 size={22} /></span><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#176b55]">Último passo</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Vamos preparar seu espaço, {userName.split(" ")[0]}.</h1><p className="mt-3 text-sm leading-6 text-[#6f7b77]">Informe o nome usado no dia a dia. Um consultório e a forma de atendimento particular serão criados como configuração inicial.</p><form action={submit} className="mt-7"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Nome da clínica</span><input name="clinic_name" required minLength={2} maxLength={120} autoComplete="organization" className="auth-input" placeholder="Ex.: Clínica Sorriso" /></label>{error ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}<button disabled={pending} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#176b55] text-sm font-semibold text-white hover:bg-[#0f513f] disabled:opacity-60">{pending ? <LoaderCircle size={18} className="animate-spin" /> : <>Entrar no Odonto<ArrowRight size={17} /></>}</button></form></div>;
}
