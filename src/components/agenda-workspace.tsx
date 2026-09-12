"use client";

import {
  Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  Clock3, FileText, LayoutDashboard, Menu, MessageCircle, MoreHorizontal, Plus,
  Search, Settings, ShieldAlert, Stethoscope, Users, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";

type AppointmentStatus = "Confirmado" | "Em espera" | "Em atendimento" | "Agendado";
type Tone = "green" | "amber" | "blue" | "slate";

type Appointment = {
  id: number; patient: string; initials: string; phone: string; time: string; end: string;
  duration: string; professional: "Dra. Laura" | "Dr. Rafael" | "Dra. Camila";
  treatment: string; status: AppointmentStatus; tone: Tone; top: number; height: number;
  alert?: string; balance: string;
};

const appointments: Appointment[] = [
  { id: 1, patient: "Marina Costa", initials: "MC", phone: "(11) 99941-0286", time: "08:00", end: "09:00", duration: "60 min", professional: "Dra. Laura", treatment: "Profilaxia e avaliação", status: "Confirmado", tone: "green", top: 0, height: 66, alert: "Alergia a dipirona", balance: "Sem pendências" },
  { id: 2, patient: "Paulo Nogueira", initials: "PN", phone: "(11) 98831-2450", time: "09:30", end: "10:30", duration: "60 min", professional: "Dra. Laura", treatment: "Restauração · dente 26", status: "Em espera", tone: "amber", top: 108, height: 66, balance: "R$ 180 em aberto" },
  { id: 3, patient: "Joana Freitas", initials: "JF", phone: "(11) 99774-1082", time: "11:00", end: "12:00", duration: "60 min", professional: "Dra. Laura", treatment: "Retorno clínico", status: "Agendado", tone: "slate", top: 216, height: 66, balance: "Sem pendências" },
  { id: 4, patient: "Lucas Almeida", initials: "LA", phone: "(11) 99120-3374", time: "08:30", end: "10:00", duration: "90 min", professional: "Dr. Rafael", treatment: "Implante · dente 15", status: "Em atendimento", tone: "blue", top: 36, height: 102, alert: "Hipertensão controlada", balance: "R$ 1.250 a receber" },
  { id: 5, patient: "Renata Lopes", initials: "RL", phone: "(11) 99662-6811", time: "10:30", end: "11:30", duration: "60 min", professional: "Dr. Rafael", treatment: "Planejamento cirúrgico", status: "Confirmado", tone: "green", top: 180, height: 66, balance: "Sem pendências" },
  { id: 6, patient: "Bruno Martins", initials: "BM", phone: "(11) 98745-5502", time: "08:00", end: "08:45", duration: "45 min", professional: "Dra. Camila", treatment: "Manutenção ortodôntica", status: "Confirmado", tone: "green", top: 0, height: 48, balance: "R$ 220 em aberto" },
  { id: 7, patient: "Ana Beatriz", initials: "AB", phone: "(11) 99008-7193", time: "09:00", end: "10:00", duration: "60 min", professional: "Dra. Camila", treatment: "Documentação ortodôntica", status: "Agendado", tone: "slate", top: 72, height: 66, alert: "Paciente menor de idade", balance: "Sem pendências" },
];

const professionals = [
  { name: "Dra. Laura", role: "Clínica geral", initials: "LM", color: "bg-emerald-700" },
  { name: "Dr. Rafael", role: "Implantodontia", initials: "RS", color: "bg-sky-700" },
  { name: "Dra. Camila", role: "Ortodontia", initials: "CA", color: "bg-violet-700" },
] as const;

const nav = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/" }, { label: "Agenda", icon: CalendarDays, href: "/agenda", active: true },
  { label: "Pacientes", icon: Users, href: "#" }, { label: "Clínica", icon: Stethoscope, href: "#" },
  { label: "Financeiro", icon: CircleDollarSign, href: "#" }, { label: "Relatórios", icon: FileText, href: "#" },
];

const toneClasses: Record<Tone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  blue: "border-sky-200 bg-sky-50 text-sky-950",
  slate: "border-slate-200 bg-white text-slate-900",
};
const dotClasses: Record<Tone, string> = { green: "bg-emerald-600", amber: "bg-amber-500", blue: "bg-sky-600", slate: "bg-slate-400" };

function AppointmentCard({ appointment, onSelect }: { appointment: Appointment; onSelect: (appointment: Appointment) => void }) {
  return (
    <button onClick={() => onSelect(appointment)} className={`absolute inset-x-2 overflow-hidden rounded-xl border p-3 text-left shadow-[0_1px_2px_rgba(20,32,28,.04)] transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[appointment.tone]}`} style={{ top: appointment.top, height: appointment.height }}>
      <div className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[appointment.tone]}`} /><span className="truncate text-sm font-semibold">{appointment.patient}</span><span className="ml-auto text-xs font-medium opacity-65">{appointment.time}</span></div>
      {appointment.height > 55 && <p className="mt-1 truncate text-xs opacity-70">{appointment.treatment}</p>}
    </button>
  );
}

export function AgendaWorkspace() {
  const [selected, setSelected] = useState<Appointment | null>(appointments[3]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"Dia" | "Semana">("Dia");
  const [statuses, setStatuses] = useState<Record<number, AppointmentStatus>>({});
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? appointments.filter((item) => `${item.patient} ${item.treatment}`.toLowerCase().includes(normalized)) : appointments;
  }, [query]);
  const currentStatus = selected ? statuses[selected.id] ?? selected.status : null;

  return (
    <div className="min-h-screen bg-[#f3f5f4] text-[#17201d] lg:flex">
      <aside className="hidden min-h-screen w-[232px] shrink-0 flex-col bg-[#111a17] px-4 py-5 text-white lg:flex">
        <div className="flex h-10 items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d8f66a] text-sm font-black text-[#17201d]">O</div><div><div className="text-[17px] font-semibold tracking-tight">Odonto</div><div className="text-[11px] text-white/45">Clínica integrada</div></div></div>
        <nav className="mt-9 space-y-1" aria-label="Navegação principal">
          {nav.map((item) => <Link href={item.href} key={item.label} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${item.active ? "bg-white/11 font-medium text-white" : "text-white/58 hover:bg-white/6 hover:text-white"}`}><item.icon size={18} strokeWidth={1.8} />{item.label}</Link>)}
        </nav>
        <div className="mt-auto space-y-1"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/58 hover:bg-white/6 hover:text-white"><Settings size={18} />Configurações</button><div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-5"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold">GM</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Guilherme</p><p className="truncate text-[11px] text-white/42">Administrador</p></div><ChevronDown size={15} className="text-white/40" /></div></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex h-[68px] items-center gap-3 border-b border-[#dce2df] bg-white px-4 sm:px-6"><button className="rounded-lg p-2 text-slate-600 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button><div className="relative hidden max-w-[380px] flex-1 sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar paciente ou procedimento" className="h-10 w-full rounded-xl border border-[#dce2df] bg-[#f7f8f8] pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/8" /></div><div className="ml-auto flex items-center gap-2"><button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dce2df] bg-white text-slate-600 hover:bg-slate-50" aria-label="Notificações"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" /></button><button className="flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f513f]"><Plus size={17} /><span className="hidden sm:inline">Novo agendamento</span></button></div></header>

        <section className="p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#68736f]"><span>Agenda</span><span>·</span><span>12 atendimentos hoje</span></div><h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">Segunda-feira, 14 de setembro</h1></div><div className="flex items-center gap-2"><div className="flex rounded-xl border border-[#dce2df] bg-white p-1">{(["Dia", "Semana"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${view === item ? "bg-[#17201d] text-white" : "text-[#68736f]"}`}>{item}</button>)}</div><div className="flex rounded-xl border border-[#dce2df] bg-white p-1"><button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-50" aria-label="Dia anterior"><ChevronLeft size={17} /></button><button className="px-2 text-xs font-semibold">Hoje</button><button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-50" aria-label="Próximo dia"><ChevronRight size={17} /></button></div></div></div>

          <div className={`grid min-h-[680px] overflow-hidden rounded-2xl border border-[#dce2df] bg-white shadow-[0_10px_35px_rgba(23,32,29,.05)] ${selected ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"}`}>
            <div className="min-w-0 overflow-x-auto scrollbar-thin"><div className="min-w-[760px]"><div className="grid grid-cols-[64px_repeat(3,minmax(210px,1fr))] border-b border-[#dce2df] bg-[#fbfcfb]"><div className="border-r border-[#e7ebe9]" />{professionals.map((professional) => <div key={professional.name} className="flex h-[68px] items-center gap-3 border-r border-[#e7ebe9] px-4 last:border-r-0"><div className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white ${professional.color}`}>{professional.initials}</div><div><p className="text-sm font-semibold">{professional.name}</p><p className="text-xs text-[#7b8581]">{professional.role}</p></div></div>)}</div><div className="grid grid-cols-[64px_repeat(3,minmax(210px,1fr))]"><div className="border-r border-[#e7ebe9] bg-[#fbfcfb] pt-2 text-right">{["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((time) => <div key={time} className="h-[72px] pr-3 text-[11px] font-medium text-[#89928f]">{time}</div>)}</div>{professionals.map((professional) => <div key={professional.name} className="schedule-grid relative min-h-[648px] border-r border-[#e7ebe9] last:border-r-0">{filtered.filter((item) => item.professional === professional.name).map((appointment) => <AppointmentCard key={appointment.id} appointment={{ ...appointment, status: statuses[appointment.id] ?? appointment.status }} onSelect={setSelected} />)}</div>)}</div></div></div>

            {selected && <aside className="border-l border-[#dce2df] bg-[#fbfcfb] p-5"><div className="flex items-center justify-between"><span className="rounded-lg bg-[#e7ecea] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#51605b]">{currentStatus}</span><div className="flex"><button className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Mais ações"><MoreHorizontal size={18} /></button><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Fechar painel"><X size={18} /></button></div></div><div className="mt-6 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#dce9e4] text-sm font-bold text-[#176b55]">{selected.initials}</div><div><h2 className="text-lg font-semibold tracking-tight">{selected.patient}</h2><p className="text-xs text-[#68736f]">{selected.phone}</p></div></div>{selected.alert && <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950"><ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="text-xs font-semibold">Alerta clínico</p><p className="mt-0.5 text-xs text-amber-900/70">{selected.alert}</p></div></div>}<div className="mt-5 space-y-4 border-y border-[#e1e6e3] py-5"><div className="flex gap-3"><Clock3 size={17} className="mt-0.5 text-[#71807b]" /><div><p className="text-xs text-[#7b8581]">Horário</p><p className="mt-0.5 text-sm font-medium">{selected.time} — {selected.end} · {selected.duration}</p></div></div><div className="flex gap-3"><Stethoscope size={17} className="mt-0.5 text-[#71807b]" /><div><p className="text-xs text-[#7b8581]">Atendimento</p><p className="mt-0.5 text-sm font-medium">{selected.treatment}</p><p className="mt-0.5 text-xs text-[#7b8581]">{selected.professional}</p></div></div><div className="flex gap-3"><CircleDollarSign size={17} className="mt-0.5 text-[#71807b]" /><div><p className="text-xs text-[#7b8581]">Financeiro</p><p className="mt-0.5 text-sm font-medium">{selected.balance}</p></div></div></div><div className="mt-5"><p className="mb-2 text-xs font-semibold text-[#52605b]">Atualizar atendimento</p><div className="grid grid-cols-2 gap-2">{(["Confirmado", "Em espera", "Em atendimento", "Agendado"] as AppointmentStatus[]).map((status) => <button key={status} onClick={() => setStatuses((current) => ({ ...current, [selected.id]: status }))} className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${currentStatus === status ? "border-[#176b55] bg-[#e9f5f0] text-[#0f513f]" : "border-[#dce2df] bg-white text-[#64706c] hover:border-[#aebbb6]"}`}>{status}</button>)}</div></div><div className="mt-5 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-xl border border-[#dce2df] bg-white px-3 py-2.5 text-xs font-semibold hover:border-[#9eaaa6]"><MessageCircle size={15} />WhatsApp</button><button className="rounded-xl bg-[#17201d] px-3 py-2.5 text-xs font-semibold text-white hover:bg-black">Abrir ficha</button></div></aside>}
          </div>
        </section>
      </main>
    </div>
  );
}
