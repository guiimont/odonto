import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight, Plus, Search, ShieldAlert, UserRound, Users } from "lucide-react";
import { getClinicContext } from "@/lib/clinic-context";
import { WorkspaceShell } from "@/components/workspace-shell";

function age(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) years--;
  return years;
}

function phone(value: string | null) {
  if (!value) return "Sem telefone";
  const digits = value.replace(/\D/g, "").replace(/^55/, "");
  return digits.length === 11 ? `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}` : value;
}

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");
  const query = (await searchParams).q?.trim().replace(/[%_,]/g, "").slice(0, 80) ?? "";

  let patientsQuery = context.supabase.from("patients").select("id, public_id, full_name, social_name, birth_date, phone_e164, whatsapp_e164, created_at").eq("clinic_id", context.clinic.id).is("deleted_at", null).order("full_name").limit(100);
  if (query) patientsQuery = patientsQuery.ilike("full_name", `%${query}%`);
  const patientsResult = await patientsQuery;
  const patients = patientsResult.data ?? [];
  const patientIds = patients.map((patient) => patient.id);
  const alertsResult = patientIds.length ? await context.supabase.from("patient_medical_alerts").select("patient_id").in("patient_id", patientIds).eq("active", true).is("deleted_at", null) : { data: [] };
  const alerts = alertsResult.data ?? [];
  const alertIds = new Set(alerts.map((alert) => alert.patient_id));

  return <WorkspaceShell clinicName={context.clinic.trade_name} userName={context.profile.full_name}><main><header className="flex min-h-[68px] items-center border-b border-[#dce2df] bg-white px-4 sm:px-6"><div><p className="text-sm font-semibold">Pacientes</p><p className="text-xs text-[#7a8581]">Base clínica centralizada</p></div><Link href="/patients/new" className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-4 text-sm font-semibold text-white hover:bg-[#0f513f]"><Plus size={17} />Novo paciente</Link></header><section className="p-4 sm:p-6 lg:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#176b55]">Relacionamento clínico</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Quem cuidamos</h1><p className="mt-1 text-sm text-[#6f7b77]">Acesse contexto clínico, tratamento e financeiro sem trocar de sistema.</p></div><div className="rounded-2xl border border-[#dce2df] bg-white px-5 py-3"><p className="text-[11px] font-medium text-[#7a8581]">Pacientes ativos</p><p className="mt-0.5 text-xl font-semibold">{patients.length}</p></div></div><form className="relative mt-6 max-w-xl"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#85908c]" /><input name="q" defaultValue={query} placeholder="Buscar pelo nome do paciente" className="h-12 w-full rounded-2xl border border-[#dce2df] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></form>
  {patients.length ? <div className="mt-5 overflow-hidden rounded-2xl border border-[#dce2df] bg-white"><div className="grid grid-cols-[minmax(0,1fr)_160px_120px_36px] border-b border-[#e7ebe9] bg-[#f8faf9] px-5 py-3 text-[11px] font-semibold uppercase tracking-[.08em] text-[#7b8581]"><span>Paciente</span><span>Contato</span><span>Idade</span><span /></div>{patients.map((patient) => <Link href={`/patients/${patient.public_id}`} key={patient.id} className="grid grid-cols-[minmax(0,1fr)_160px_120px_36px] items-center border-b border-[#edf0ee] px-5 py-4 transition last:border-0 hover:bg-[#f8faf9]"><span className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f1ed] text-xs font-bold text-[#176b55]">{patient.full_name.split(" ").slice(0,2).map((part) => part[0]).join("")}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{patient.social_name || patient.full_name}</span><span className="mt-0.5 flex items-center gap-2 text-xs text-[#7b8581]">{patient.social_name ? patient.full_name : "Prontuário ativo"}{alertIds.has(patient.id) ? <span className="flex items-center gap-1 font-semibold text-amber-700"><ShieldAlert size={12} />Alerta</span> : null}</span></span></span><span className="text-xs text-[#5f6c67]">{phone(patient.whatsapp_e164 || patient.phone_e164)}</span><span className="text-xs text-[#5f6c67]">{age(patient.birth_date) !== null ? `${age(patient.birth_date)} anos` : "Não informada"}</span><ChevronRight size={17} className="text-[#9aa39f]" /></Link>)}</div> : <div className="mt-6 grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-[#cfd8d4] bg-white p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf3f0] text-[#176b55]">{query ? <UserRound size={24} /> : <Users size={24} />}</span><h2 className="mt-5 text-lg font-semibold">{query ? "Nenhum paciente encontrado" : "Sua base começa aqui"}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#74807c]">{query ? "Revise a busca ou limpe o filtro para visualizar toda a base." : "Cadastre o primeiro paciente para abrir o prontuário, registrar alertas e iniciar o histórico clínico."}</p>{query ? <Link href="/patients" className="mt-5 inline-flex text-sm font-semibold text-[#176b55]">Limpar busca</Link> : <Link href="/patients/new" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-4 text-sm font-semibold text-white"><CalendarDays size={16} />Cadastrar paciente</Link>}</div></div>}</section></main></WorkspaceShell>;
}
