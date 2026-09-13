import Link from "next/link";
import {
  CalendarCheck2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Menu,
  Plus,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import type { Database } from "@/types/database";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export type DashboardData = {
  patientCount: number;
  appointmentCount: number;
  completedCount: number;
  noShowCount: number;
  production: number;
  paid: number;
  received: number;
  overdueAmount: number;
  overdueCount: number;
  pendingBudgetAmount: number;
  pendingBudgetCount: number;
  waitingCount: number;
  unconfirmedCount: number;
  chart: Array<{ key: string; label: string; produced: number; received: number }>;
  upcoming: Array<{
    publicId: string;
    patientPublicId: string;
    time: string;
    patient: string;
    professional: string;
    description: string;
    status: AppointmentStatus;
  }>;
  currentMonthLabel: string;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const integer = new Intl.NumberFormat("pt-BR");

const statusConfig: Record<AppointmentStatus, { label: string; dot: string }> = {
  scheduled: { label: "Agendado", dot: "bg-slate-400" },
  confirmed: { label: "Confirmado", dot: "bg-emerald-600" },
  waiting_room: { label: "Em espera", dot: "bg-amber-500" },
  in_service: { label: "Em atendimento", dot: "bg-sky-600" },
  completed: { label: "Concluído", dot: "bg-teal-700" },
  no_show: { label: "Faltou", dot: "bg-rose-500" },
  cancelled: { label: "Cancelado", dot: "bg-slate-300" },
};

function MetricCard({ label, value, context, icon: Icon }: { label: string; value: string; context: string; icon: typeof CalendarDays }) {
  return (
    <article className="rounded-2xl border border-[#dce2df] bg-white p-5 shadow-[0_5px_20px_rgba(23,32,29,.035)]">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf3f0] text-[#176b55]"><Icon size={19} /></span>
      <p className="mt-5 text-xs font-medium text-[#74807c]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{value}</p>
      <p className="mt-1 text-xs text-[#8a9490]">{context}</p>
    </article>
  );
}

function ProductionChart({ data }: { data: DashboardData["chart"] }) {
  const ceiling = Math.max(1, ...data.flatMap((item) => [item.produced, item.received]));
  const hasData = data.some((item) => item.produced > 0 || item.received > 0);

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-5 text-[11px] font-medium text-[#68736f]">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#176b55]" />Produzido</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#9bcabb]" />Recebido líquido</span>
      </div>
      <div className="relative flex h-48 items-end gap-3 border-b border-[#e4e8e6]">
        {!hasData ? <div className="absolute inset-0 grid place-items-center text-center"><span><span className="block text-sm font-semibold text-[#52605b]">O histórico financeiro começa aqui</span><span className="mt-1 block text-xs text-[#8a9490]">O gráfico será preenchido conforme lançamentos forem liquidados.</span></span></div> : null}
        {data.map((item) => (
          <div key={item.key} className="group relative flex h-full flex-1 items-end justify-center gap-1">
            <div title={`Produzido: ${money.format(item.produced)}`} className="w-[38%] min-w-1 rounded-t-md bg-[#176b55] transition-opacity group-hover:opacity-80" style={{ height: item.produced ? `${Math.max(5, item.produced / ceiling * 100)}%` : 0 }} />
            <div title={`Recebido: ${money.format(item.received)}`} className="w-[38%] min-w-1 rounded-t-md bg-[#9bcabb] transition-opacity group-hover:opacity-80" style={{ height: item.received ? `${Math.max(5, item.received / ceiling * 100)}%` : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-3 text-center text-[10px] font-medium capitalize text-[#8a9490]">{data.map((item) => <span key={item.key}>{item.label}</span>)}</div>
    </div>
  );
}

function ProgressLine({ label, value, percent, tone }: { label: string; value: number; percent: number; tone: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-xs"><span className="text-white/65">{label}</span><span className="font-semibold">{money.format(value)} <span className="ml-1 text-white/35">{percent}%</span></span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

export function DashboardWorkspace({ clinicName, userName, data }: { clinicName: string; userName: string; data: DashboardData }) {
  const firstName = userName.split(" ")[0];
  const attendanceBase = data.completedCount + data.noShowCount;
  const attendanceRate = attendanceBase ? Math.round(data.completedCount / attendanceBase * 100) : null;
  const producedBase = Math.max(data.production, data.paid, data.received, 1);
  const paidPercent = Math.min(100, Math.round(data.paid / producedBase * 100));
  const receivedPercent = Math.min(100, Math.round(data.received / producedBase * 100));
  const attention = [
    data.waitingCount ? { count: data.waitingCount, title: "Paciente na sala de espera", detail: "Acompanhe o tempo até o atendimento", tone: "border-amber-200 bg-amber-50 text-amber-800" } : null,
    data.unconfirmedCount ? { count: data.unconfirmedCount, title: "Consulta sem confirmação hoje", detail: "Confirme antes do horário agendado", tone: "border-sky-200 bg-sky-50 text-sky-800" } : null,
    data.pendingBudgetCount ? { count: data.pendingBudgetCount, title: "Plano aguardando decisão", detail: `${money.format(data.pendingBudgetAmount)} em oportunidade`, tone: "border-violet-200 bg-violet-50 text-violet-800" } : null,
    data.overdueCount ? { count: data.overdueCount, title: "Parcela vencida", detail: `${money.format(data.overdueAmount)} em aberto`, tone: "border-rose-200 bg-rose-50 text-rose-800" } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <WorkspaceShell clinicName={clinicName} userName={userName}>
      <main className="min-w-0 flex-1">
        <header className="flex h-[68px] items-center gap-3 border-b border-[#dce2df] bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{clinicName}</p><p className="text-xs capitalize text-[#7a8581]">{data.currentMonthLabel}</p></div>
          <div className="ml-auto flex items-center gap-2"><Link href="/agenda?new=1" className="flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f513f]"><Plus size={17} /><span className="hidden sm:inline">Novo agendamento</span></Link></div>
        </header>

        <section className="p-4 sm:p-6 lg:p-7">
          <div>
            <p className="mb-1 text-xs font-medium text-[#68736f]">Operação em tempo real</p>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[30px]">Olá, {firstName}</h1>
            <p className="mt-1 text-sm text-[#68736f]">{attention.length ? `${attention.length} ${attention.length === 1 ? "ponto pede" : "pontos pedem"} atenção agora.` : "Nenhuma pendência operacional crítica agora."}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <MetricCard label="Consultas no mês" value={integer.format(data.appointmentCount)} context={`${data.completedCount} concluídas · ${data.noShowCount} faltas`} icon={CalendarDays} />
            <MetricCard label="Pacientes ativos" value={integer.format(data.patientCount)} context="Cadastros disponíveis nesta clínica" icon={Users} />
            <MetricCard label="Produção no mês" value={money.format(data.production)} context="Receitas clínicas lançadas" icon={TrendingUp} />
            <MetricCard label="Recebido líquido" value={money.format(data.received)} context={data.overdueAmount ? `${money.format(data.overdueAmount)} vencidos` : "Nenhuma parcela vencida"} icon={WalletCards} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
            <article className="rounded-2xl border border-[#dce2df] bg-white p-5 sm:p-6">
              <div><p className="text-sm font-semibold">Produção e caixa</p><p className="mt-1 text-xs text-[#7a8581]">Dados reais dos últimos seis meses</p></div>
              <div className="mt-4 flex flex-wrap items-baseline gap-3"><span className="text-[28px] font-semibold tracking-[-0.04em]">{money.format(data.chart.reduce((sum, item) => sum + item.produced, 0))}</span><span className="text-xs font-semibold text-[#68736f]">produção no período</span></div>
              <ProductionChart data={data.chart} />
            </article>

            <article className="rounded-2xl border border-[#dce2df] bg-[#17201d] p-5 text-white sm:p-6">
              <p className="text-sm font-semibold">Saúde financeira</p><p className="mt-1 text-xs text-white/50">Do lançamento ao valor efetivamente liquidado</p>
              <div className="mt-6 space-y-5">
                <ProgressLine label="Produzido" value={data.production} percent={data.production ? 100 : 0} tone="bg-[#d8f66a]" />
                <ProgressLine label="Pago pelos pacientes" value={data.paid} percent={paidPercent} tone="bg-emerald-400" />
                <ProgressLine label="Recebido em caixa" value={data.received} percent={receivedPercent} tone="bg-sky-400" />
              </div>
              <div className="mt-7 rounded-xl bg-white/7 p-3"><div className="flex items-center justify-between"><span className="text-xs text-white/55">Taxa de comparecimento</span><span className="text-sm font-semibold">{attendanceRate === null ? "Sem base" : `${attendanceRate}%`}</span></div><p className="mt-1 text-[11px] text-white/35">Calculada apenas sobre consultas encerradas no mês.</p></div>
            </article>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.85fr)]">
            <article className="rounded-2xl border border-[#dce2df] bg-white">
              <div className="flex items-center justify-between border-b border-[#e3e8e5] px-5 py-4"><div><p className="text-sm font-semibold">Próximos atendimentos</p><p className="mt-0.5 text-xs text-[#7a8581]">Fluxo clínico de hoje</p></div><Link href="/agenda" className="text-xs font-semibold text-[#176b55] hover:underline">Ver agenda</Link></div>
              {data.upcoming.length ? <div>{data.upcoming.map((item) => <Link href={`/patients/${item.patientPublicId}`} key={item.publicId} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#edf0ee] px-5 py-3.5 last:border-0 hover:bg-[#fbfcfb]"><span className="font-mono text-xs font-semibold text-[#697570]">{item.time}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.patient}</p><p className="mt-0.5 truncate text-xs text-[#7d8884]">{item.description} · {item.professional}</p></div><span className="flex items-center gap-1.5 text-[11px] font-medium text-[#61706b]"><span className={`h-2 w-2 rounded-full ${statusConfig[item.status].dot}`} />{statusConfig[item.status].label}</span></Link>)}</div> : <div className="grid min-h-44 place-items-center px-6 text-center"><span><CalendarCheck2 className="mx-auto text-[#9aa49f]" size={25} /><span className="mt-3 block text-sm font-semibold text-[#52605b]">Agenda livre hoje</span><span className="mt-1 block text-xs text-[#8a9490]">Os próximos atendimentos aparecerão aqui.</span></span></div>}
            </article>

            <article className="rounded-2xl border border-[#dce2df] bg-white p-5">
              <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Precisa de atenção</p><p className="mt-1 text-xs text-[#7a8581]">Pendências clínicas e financeiras</p></div><Clock3 size={18} className="text-[#89938f]" /></div>
              {attention.length ? <div className="mt-4 space-y-2.5">{attention.map((item) => <div key={item.title} className={`flex w-full items-center gap-3 rounded-xl border p-3 ${item.tone}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-sm font-bold">{item.count}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{item.title}</span><span className="mt-0.5 block truncate text-[11px] opacity-65">{item.detail}</span></span></div>)}</div> : <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800"><CircleDollarSign className="mx-auto" size={23} /><p className="mt-2 text-xs font-semibold">Tudo em ordem</p><p className="mt-1 text-[11px] opacity-70">Sem pendências detectadas nos dados atuais.</p></div>}
            </article>
          </div>
        </section>
      </main>
    </WorkspaceShell>
  );
}
