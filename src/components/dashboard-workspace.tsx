import Link from "next/link";
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, CircleDollarSign,
  Clock3, Menu, MoreHorizontal, Plus, Search, TrendingUp, WalletCards,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

const kpis = [
  { label: "Ocupação da agenda", value: "84%", context: "37 de 44 horários", trend: "+6,2%", positive: true, icon: CalendarDays },
  { label: "Produção no mês", value: "R$ 48.760", context: "92 procedimentos", trend: "+12,4%", positive: true, icon: TrendingUp },
  { label: "Recebido líquido", value: "R$ 35.280", context: "Após taxas e estornos", trend: "+8,1%", positive: true, icon: WalletCards },
  { label: "Inadimplência", value: "R$ 4.320", context: "18 parcelas vencidas", trend: "-2,8%", positive: true, icon: CircleDollarSign },
];

const agenda = [
  { time: "08:30", patient: "Lucas Almeida", treatment: "Implante · dente 15", professional: "Dr. Rafael", status: "Em atendimento", color: "bg-sky-500" },
  { time: "09:30", patient: "Paulo Nogueira", treatment: "Restauração · dente 26", professional: "Dra. Laura", status: "Em espera", color: "bg-amber-500" },
  { time: "10:30", patient: "Renata Lopes", treatment: "Planejamento cirúrgico", professional: "Dr. Rafael", status: "Confirmado", color: "bg-emerald-600" },
  { time: "11:00", patient: "Joana Freitas", treatment: "Retorno clínico", professional: "Dra. Laura", status: "Agendado", color: "bg-slate-400" },
];

const actions = [
  { count: 3, title: "Pacientes aguardando", detail: "Maior espera: 18 minutos", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  { count: 7, title: "Orçamentos sem retorno", detail: "R$ 9.840 em oportunidade", tone: "bg-violet-50 text-violet-800 border-violet-200" },
  { count: 4, title: "Repasses previstos hoje", detail: "R$ 2.460 líquidos", tone: "bg-sky-50 text-sky-800 border-sky-200" },
];

function RevenueChart() {
  return (
    <div className="mt-5">
      <div className="flex h-48 items-end gap-3 border-b border-[#e4e8e6] px-1">
        {[42, 58, 49, 72, 65, 88, 78, 94, 83, 102, 96, 116].map((height, index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-[#cde6dc] transition group-hover:bg-[#176b55]" style={{ height }}><span className="absolute -top-1 left-1/2 hidden -translate-x-1/2 rounded bg-[#17201d] px-2 py-1 text-[10px] text-white group-hover:block">R$ {(height * 410).toLocaleString("pt-BR")}</span></div></div>)}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-[#8a9490]"><span>Jan</span><span>Mar</span><span>Mai</span><span>Jul</span><span>Set</span><span>Nov</span></div>
    </div>
  );
}

export function DashboardWorkspace({ clinicName, userName }: { clinicName: string; userName: string }) {
  const firstName = userName.split(" ")[0];
  return (
    <WorkspaceShell clinicName={clinicName} userName={userName}>
      <main className="min-w-0 flex-1">
        <header className="flex h-[68px] items-center gap-3 border-b border-[#dce2df] bg-white px-4 sm:px-6"><button className="rounded-lg p-2 text-slate-600 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button><div className="relative hidden max-w-[380px] flex-1 sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input placeholder="Buscar paciente, agenda ou procedimento" className="h-10 w-full rounded-xl border border-[#dce2df] bg-[#f7f8f8] pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/8" /></div><div className="ml-auto flex items-center gap-2"><Link href="/agenda" className="flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f513f]"><Plus size={17} /><span className="hidden sm:inline">Novo agendamento</span></Link></div></header>

        <section className="p-4 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-medium text-[#68736f]">Visão executiva da clínica</p><h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[30px]">Bom dia, {firstName}</h1><p className="mt-1 text-sm text-[#68736f]">A clínica está operando dentro do esperado.</p></div><button className="flex h-10 items-center gap-2 rounded-xl border border-[#dce2df] bg-white px-3.5 text-xs font-semibold text-[#52605b] hover:bg-slate-50">Este mês<ChevronDown size={15} /></button></div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {kpis.map((kpi) => <article key={kpi.label} className="rounded-2xl border border-[#dce2df] bg-white p-5 shadow-[0_5px_20px_rgba(23,32,29,.035)]"><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf3f0] text-[#176b55]"><kpi.icon size={19} /></div><span className={`flex items-center gap-1 text-xs font-semibold ${kpi.positive ? "text-emerald-700" : "text-rose-600"}`}>{kpi.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{kpi.trend}</span></div><p className="mt-5 text-xs font-medium text-[#74807c]">{kpi.label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{kpi.value}</p><p className="mt-1 text-xs text-[#8a9490]">{kpi.context}</p></article>)}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
            <article className="rounded-2xl border border-[#dce2df] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Produção e recebimento</p><p className="mt-1 text-xs text-[#7a8581]">Valor bruto produzido nos últimos 12 meses</p></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" aria-label="Mais opções"><MoreHorizontal size={18} /></button></div><div className="mt-4 flex items-baseline gap-3"><span className="text-[28px] font-semibold tracking-[-0.04em]">R$ 486 mil</span><span className="text-xs font-semibold text-emerald-700">+14,2% no ano</span></div><RevenueChart /></article>

            <article className="rounded-2xl border border-[#dce2df] bg-[#17201d] p-5 text-white sm:p-6"><p className="text-sm font-semibold">Saúde financeira</p><p className="mt-1 text-xs text-white/50">Do produzido ao caixa disponível</p><div className="mt-6 space-y-5">{[
              ["Produzido", "R$ 48.760", "100%", "w-full bg-[#d8f66a]"], ["Pago pelos pacientes", "R$ 38.410", "79%", "w-[79%] bg-emerald-400"], ["Recebido em caixa", "R$ 35.280", "72%", "w-[72%] bg-sky-400"],
            ].map(([label, value, percent, width]) => <div key={label}><div className="mb-2 flex justify-between text-xs"><span className="text-white/65">{label}</span><span className="font-semibold">{value} <span className="ml-1 text-white/35">{percent}</span></span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${width}`} /></div></div>)}</div><div className="mt-7 rounded-xl bg-white/7 p-3"><div className="flex items-center justify-between"><span className="text-xs text-white/55">Aguardando repasse</span><span className="text-sm font-semibold">R$ 3.130</span></div><p className="mt-1 text-[11px] text-white/35">Não está incluído no caixa recebido.</p></div></article>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.85fr)]">
            <article className="rounded-2xl border border-[#dce2df] bg-white"><div className="flex items-center justify-between border-b border-[#e3e8e5] px-5 py-4"><div><p className="text-sm font-semibold">Próximos atendimentos</p><p className="mt-0.5 text-xs text-[#7a8581]">Fluxo clínico de hoje</p></div><Link href="/agenda" className="text-xs font-semibold text-[#176b55] hover:underline">Ver agenda completa</Link></div><div>{agenda.map((item) => <div key={`${item.time}-${item.patient}`} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#edf0ee] px-5 py-3.5 last:border-0"><span className="font-mono text-xs font-semibold text-[#697570]">{item.time}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.patient}</p><p className="mt-0.5 truncate text-xs text-[#7d8884]">{item.treatment} · {item.professional}</p></div><span className="flex items-center gap-1.5 text-[11px] font-medium text-[#61706b]"><span className={`h-2 w-2 rounded-full ${item.color}`} />{item.status}</span></div>)}</div></article>

            <article className="rounded-2xl border border-[#dce2df] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Precisa de atenção</p><p className="mt-1 text-xs text-[#7a8581]">Pendências que afetam o dia</p></div><Clock3 size={18} className="text-[#89938f]" /></div><div className="mt-4 space-y-2.5">{actions.map((action) => <button key={action.title} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${action.tone}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-sm font-bold">{action.count}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{action.title}</span><span className="mt-0.5 block truncate text-[11px] opacity-65">{action.detail}</span></span></button>)}</div></article>
          </div>
        </section>
      </main>
    </WorkspaceShell>
  );
}
