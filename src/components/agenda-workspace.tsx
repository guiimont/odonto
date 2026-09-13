"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  Clock3, Menu, MessageCircle, MoreHorizontal, Plus, Search, ShieldAlert,
  Stethoscope, UserRound, X,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { addCalendarDays } from "@/lib/date-time";
import { createAppointment, updateAppointmentStatus } from "@/app/agenda/actions";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["appointment_status"];
type Appointment = {
  publicId: string;
  patientPublicId: string;
  patientName: string;
  patientPhone: string | null;
  professionalId: string;
  professionalName: string;
  chairId: number | null;
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: Status;
  observations: string | null;
  alerts: string[];
};

type Professional = { id: string; name: string; specialty: string };
type Patient = { publicId: string; name: string };
type Chair = { id: number; name: string };

const statusConfig: Record<Status, { label: string; card: string; dot: string }> = {
  scheduled: { label: "Agendado", card: "border-slate-200 bg-white text-slate-900", dot: "bg-slate-400" },
  confirmed: { label: "Confirmado", card: "border-emerald-200 bg-emerald-50 text-emerald-950", dot: "bg-emerald-600" },
  waiting_room: { label: "Em espera", card: "border-amber-200 bg-amber-50 text-amber-950", dot: "bg-amber-500" },
  in_service: { label: "Em atendimento", card: "border-sky-200 bg-sky-50 text-sky-950", dot: "bg-sky-600" },
  completed: { label: "Concluído", card: "border-teal-200 bg-teal-50 text-teal-950", dot: "bg-teal-700" },
  no_show: { label: "Faltou", card: "border-rose-200 bg-rose-50 text-rose-950", dot: "bg-rose-500" },
  cancelled: { label: "Cancelado", card: "border-slate-200 bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

const transitions: Record<Status, Status[]> = {
  scheduled: ["confirmed", "waiting_room", "in_service", "completed", "no_show", "cancelled"],
  confirmed: ["waiting_room", "in_service", "completed", "no_show", "cancelled"],
  waiting_room: ["in_service", "completed", "no_show", "cancelled"],
  in_service: ["completed", "cancelled"],
  completed: [], no_show: [], cancelled: [],
};

const hours = Array.from({ length: 14 }, (_, index) => index + 7);
const scheduleStartMinutes = 7 * 60;
const hourHeight = 72;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function phone(value: string | null) {
  if (!value) return "Telefone não informado";
  const digits = value.replace(/\D/g, "").replace(/^55/, "");
  return digits.length === 11 ? `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}` : value;
}

function minutesFromClock(clock: string) {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

function AppointmentCard({ appointment, onSelect }: { appointment: Appointment; onSelect: (appointment: Appointment) => void }) {
  const config = statusConfig[appointment.status];
  const top = Math.max(0, ((minutesFromClock(appointment.startTime) - scheduleStartMinutes) / 60) * hourHeight);
  const height = Math.max(42, (appointment.durationMinutes / 60) * hourHeight - 4);
  return <button onClick={() => onSelect(appointment)} className={`absolute inset-x-2 overflow-hidden rounded-xl border p-3 text-left shadow-[0_1px_2px_rgba(20,32,28,.04)] transition hover:-translate-y-0.5 hover:shadow-md ${config.card}`} style={{ top, height }}><span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} /><span className="truncate text-sm font-semibold">{appointment.patientName}</span><span className="ml-auto text-[11px] font-semibold opacity-65">{appointment.startTime}</span></span>{height > 54 ? <span className="mt-1 block truncate text-xs opacity-70">{appointment.observations || config.label}</span> : null}</button>;
}

export function AgendaWorkspace({ clinicName, userName, selectedDate, today, appointments, professionals, patients, chairs, initialPatientPublicId, openNew, message, messageTone }: { clinicName: string; userName: string; selectedDate: string; today: string; appointments: Appointment[]; professionals: Professional[]; patients: Patient[]; chairs: Chair[]; initialPatientPublicId?: string; openNew: boolean; message: string | null; messageTone: "success" | "error" }) {
  const [selected, setSelected] = useState<Appointment | null>(appointments[0] ?? null);
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(openNew);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return normalized ? appointments.filter((item) => `${item.patientName} ${item.professionalName} ${item.observations ?? ""}`.toLocaleLowerCase("pt-BR").includes(normalized)) : appointments;
  }, [appointments, query]);
  const selectedDateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${selectedDate}T12:00:00Z`));
  const dayGridStyle = { gridTemplateColumns: `72px repeat(${Math.max(professionals.length, 1)}, minmax(230px, 1fr))` };

  return <WorkspaceShell clinicName={clinicName} userName={userName}><main className="min-w-0"><header className="flex h-[68px] items-center gap-3 border-b border-[#dce2df] bg-white px-4 sm:px-6"><button className="rounded-lg p-2 text-slate-600 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button><label className="relative hidden max-w-[380px] flex-1 sm:block"><span className="sr-only">Buscar na agenda</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar paciente, profissional ou motivo" className="h-10 w-full rounded-xl border border-[#dce2df] bg-[#f7f8f8] pl-10 pr-4 text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/8" /></label><div className="ml-auto flex items-center gap-2"><button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dce2df] bg-white text-slate-600" aria-label="Notificações"><Bell size={18} /></button><button onClick={() => setShowNew(true)} disabled={!patients.length || !professionals.length} className="flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-3.5 text-sm font-semibold text-white hover:bg-[#0f513f] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /><span className="hidden sm:inline">Novo agendamento</span></button></div></header><section className="p-4 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#68736f]"><span>Agenda real</span><span>·</span><span>{appointments.length} {appointments.length === 1 ? "atendimento" : "atendimentos"}</span></div><h1 className="text-2xl font-semibold capitalize tracking-[-0.03em] sm:text-[28px]">{selectedDateLabel}</h1></div><div className="flex rounded-xl border border-[#dce2df] bg-white p-1"><Link href={`/agenda?date=${addCalendarDays(selectedDate, -1)}`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-50" aria-label="Dia anterior"><ChevronLeft size={17} /></Link><Link href={`/agenda?date=${today}`} className="px-3 py-2 text-xs font-semibold">Hoje</Link><Link href={`/agenda?date=${addCalendarDays(selectedDate, 1)}`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-50" aria-label="Próximo dia"><ChevronRight size={17} /></Link></div></div>{message ? <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${messageTone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{messageTone === "error" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}{message}</div> : null}{!patients.length ? <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><UserRound size={18} /><span>Cadastre um paciente antes de criar o primeiro agendamento.</span><Link href="/patients/new" className="font-semibold underline">Cadastrar agora</Link></div> : null}<div className={`grid min-h-[720px] overflow-hidden rounded-2xl border border-[#dce2df] bg-white shadow-[0_10px_35px_rgba(23,32,29,.05)] ${selected ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"}`}><div className="min-w-0 overflow-x-auto"><div className="min-w-max"><div className="grid border-b border-[#dce2df] bg-[#fbfcfb]" style={dayGridStyle}><div className="border-r border-[#e7ebe9]" />{professionals.length ? professionals.map((professional) => <div key={professional.id} className="flex h-[68px] items-center gap-3 border-r border-[#e7ebe9] px-4 last:border-r-0"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#176b55] text-xs font-semibold text-white">{initials(professional.name)}</span><span><span className="block text-sm font-semibold">{professional.name}</span><span className="block text-xs text-[#7b8581]">{professional.specialty}</span></span></div>) : <div className="flex h-[68px] items-center px-4 text-sm text-[#7b8581]">Nenhum profissional ativo</div>}</div><div className="grid" style={dayGridStyle}><div className="border-r border-[#e7ebe9] bg-[#fbfcfb] pt-2 text-right">{hours.map((hour) => <div key={hour} className="h-[72px] pr-3 text-[11px] font-medium text-[#89928f]">{String(hour).padStart(2,"0")}:00</div>)}</div>{professionals.length ? professionals.map((professional) => <div key={professional.id} className="schedule-grid relative border-r border-[#e7ebe9] last:border-r-0" style={{ height: hours.length * hourHeight }}>{filtered.filter((item) => item.professionalId === professional.id).map((appointment) => <AppointmentCard key={appointment.publicId} appointment={appointment} onSelect={setSelected} />)}</div>) : <div className="grid place-items-center text-sm text-[#7b8581]" style={{ height: hours.length * hourHeight }}>Convide ou configure um profissional para usar a agenda.</div>}</div></div></div>{selected ? <aside className="border-l border-[#dce2df] bg-[#fbfcfb] p-5"><div className="flex items-center justify-between"><span className="rounded-lg bg-[#e7ecea] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[#51605b]">{statusConfig[selected.status].label}</span><div className="flex"><button className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Mais ações"><MoreHorizontal size={18} /></button><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Fechar painel"><X size={18} /></button></div></div><div className="mt-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#dce9e4] text-sm font-bold text-[#176b55]">{initials(selected.patientName)}</span><span><h2 className="text-lg font-semibold tracking-tight">{selected.patientName}</h2><p className="text-xs text-[#68736f]">{phone(selected.patientPhone)}</p></span></div>{selected.alerts.length ? <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950"><ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" /><span><span className="block text-xs font-semibold">Alerta clínico</span><span className="mt-0.5 block text-xs text-amber-900/70">{selected.alerts.join(" · ")}</span></span></div> : null}<div className="mt-5 space-y-4 border-y border-[#e1e6e3] py-5"><div className="flex gap-3"><Clock3 size={17} className="mt-0.5 text-[#71807b]" /><span><span className="block text-xs text-[#7b8581]">Horário</span><span className="mt-0.5 block text-sm font-medium">{selected.startTime} — {selected.endTime} · {selected.durationMinutes} min</span></span></div><div className="flex gap-3"><Stethoscope size={17} className="mt-0.5 text-[#71807b]" /><span><span className="block text-xs text-[#7b8581]">Atendimento</span><span className="mt-0.5 block text-sm font-medium">{selected.observations || "Consulta odontológica"}</span><span className="mt-0.5 block text-xs text-[#7b8581]">{selected.professionalName}</span></span></div></div>{transitions[selected.status].length ? <div className="mt-5"><p className="mb-2 text-xs font-semibold text-[#52605b]">Atualizar atendimento</p><div className="grid grid-cols-2 gap-2">{transitions[selected.status].filter((status) => status !== "cancelled").map((status) => <form action={updateAppointmentStatus} key={status}><input type="hidden" name="appointment_public_id" value={selected.publicId} /><input type="hidden" name="status" value={status} /><button className="w-full rounded-xl border border-[#dce2df] bg-white px-2 py-2.5 text-xs font-medium text-[#64706c] hover:border-[#176b55] hover:text-[#176b55]">{statusConfig[status].label}</button></form>)}</div></div> : <div className="mt-5 rounded-xl bg-[#edf3f0] p-3 text-xs text-[#60706a]">Este atendimento está encerrado e preservado no histórico.</div>}<div className="mt-5 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-xl border border-[#dce2df] bg-white px-3 py-2.5 text-xs font-semibold"><MessageCircle size={15} />WhatsApp</button><Link href={`/patients/${selected.patientPublicId}`} className="flex items-center justify-center rounded-xl bg-[#17201d] px-3 py-2.5 text-xs font-semibold text-white">Abrir ficha</Link></div></aside> : null}</div></section></main>{showNew ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#0e1815]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-appointment-title"><form action={createAppointment} className="w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#e3e8e5] px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#176b55]">Agenda</p><h2 id="new-appointment-title" className="mt-1 text-xl font-semibold tracking-[-.03em]">Novo agendamento</h2></div><button type="button" onClick={() => setShowNew(false)} className="rounded-lg p-2 text-[#6f7b77] hover:bg-slate-100" aria-label="Fechar"><X size={18} /></button></div><input type="hidden" name="day" value={selectedDate} /><div className="grid gap-4 p-6 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Paciente</span><select name="patient_public_id" required defaultValue={initialPatientPublicId ?? ""} className="auth-input"><option value="">Selecione o paciente</option>{patients.map((patient) => <option value={patient.publicId} key={patient.publicId}>{patient.name}</option>)}</select></label><label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Profissional</span><select name="professional_profile_id" required className="auth-input"><option value="">Selecione o profissional</option>{professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.name}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Horário</span><input name="start_time" type="time" min="06:00" max="22:00" step="900" defaultValue="09:00" required className="auth-input" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Duração</span><select name="duration_minutes" defaultValue="60" className="auth-input">{[30,45,60,90,120,180].map((duration) => <option value={duration} key={duration}>{duration} minutos</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Consultório</span><select name="chair_id" className="auth-input"><option value="">Sem consultório definido</option>{chairs.map((chair) => <option value={chair.id} key={chair.id}>{chair.name}</option>)}</select></label><label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Motivo ou procedimento</span><textarea name="observations" rows={3} className="w-full resize-none rounded-xl border border-[#dce2df] bg-[#f8faf9] p-3 text-sm outline-none focus:border-[#176b55] focus:bg-white focus:ring-4 focus:ring-[#176b55]/8" placeholder="Ex.: Avaliação inicial, profilaxia, retorno..." /></label></div><div className="flex justify-end gap-2 border-t border-[#e3e8e5] bg-[#fafbfa] px-6 py-4"><button type="button" onClick={() => setShowNew(false)} className="h-10 rounded-xl border border-[#dce2df] bg-white px-4 text-sm font-semibold text-[#61706b]">Cancelar</button><button className="flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-4 text-sm font-semibold text-white"><CalendarDays size={16} />Salvar agendamento</button></div></form></div> : null}</WorkspaceShell>;
}
