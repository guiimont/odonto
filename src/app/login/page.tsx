import { Suspense } from "react";
import { Activity, BarChart3, ShieldCheck } from "lucide-react";
import { LoginCard } from "@/components/login-card";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#10211c] px-5 py-8 text-white sm:px-8 lg:grid lg:grid-cols-[1fr_500px] lg:items-center lg:gap-12 lg:px-[7vw]">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <section className="relative hidden max-w-2xl lg:block"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d8f66a] font-black text-[#17201d]">O</span><span className="text-xl font-semibold">Odonto</span></div><p className="mt-20 text-xs font-semibold uppercase tracking-[0.2em] text-[#d8f66a]">Gestão clínica sem ruído</p><h2 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.055em]">A informação certa aparece antes de virar problema.</h2><p className="mt-6 max-w-lg text-base leading-7 text-white/55">Agenda, prontuário e financeiro conectados com clareza cirúrgica para a rotina da clínica.</p><div className="mt-12 grid max-w-xl grid-cols-3 gap-3">{[[Activity,"Operação","Fluxo do dia"],[ShieldCheck,"Clínica","Histórico íntegro"],[BarChart3,"Gestão","Números legíveis"]].map(([Icon,title,copy]) => { const ItemIcon = Icon as typeof Activity; return <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><ItemIcon size={19} className="text-[#d8f66a]" /><p className="mt-4 text-sm font-semibold">{String(title)}</p><p className="mt-1 text-xs text-white/40">{String(copy)}</p></div>; })}</div></section>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-0"><Suspense fallback={<div className="h-[560px] w-full max-w-[430px] animate-pulse rounded-[26px] bg-white/10" />}><LoginCard /></Suspense></section>
    </main>
  );
}
