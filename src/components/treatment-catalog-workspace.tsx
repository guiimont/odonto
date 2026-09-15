"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Archive, CheckCircle2, Clock3, Edit3, Menu, PackageOpen, Plus, Search,
  ShieldCheck, Stethoscope, Tag, X,
} from "lucide-react";
import {
  initialTreatmentActionState,
  saveTreatment,
  setTreatmentActive,
} from "@/app/clinic/treatments/actions";
import { WorkspaceShell } from "@/components/workspace-shell";

type Treatment = {
  publicId: string;
  code: string | null;
  name: string;
  category: string | null;
  description: string | null;
  basePrice: number;
  costAmount: number;
  estimatedMinutes: number | null;
  segmentedByTooth: boolean;
  active: boolean;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="h-11 rounded-xl bg-[#176b55] px-5 text-sm font-semibold text-white transition hover:bg-[#0f513f] disabled:cursor-wait disabled:opacity-60">
      {pending ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar tratamento"}
    </button>
  );
}

function TreatmentForm({ treatment, onClose }: { treatment: Treatment | null; onClose: () => void }) {
  const [state, formAction] = useActionState(saveTreatment, initialTreatmentActionState);

  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state.status, state.submittedAt, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1310]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="treatment-form-title">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[24px] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[24px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e2e7e4] bg-white px-5 py-5 sm:px-7">
          <div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#176b55]">Catálogo clínico</p><h2 id="treatment-form-title" className="mt-1 text-xl font-semibold tracking-[-.025em]">{treatment ? "Editar tratamento" : "Novo tratamento"}</h2></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-[#68736f] hover:bg-[#f1f4f2]" aria-label="Fechar"><X size={20} /></button>
        </div>
        <form action={formAction} className="space-y-6 p-5 sm:p-7">
          <input type="hidden" name="publicId" value={treatment?.publicId ?? ""} />
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <label className="space-y-1.5 text-sm font-medium">Nome do tratamento<input name="name" required minLength={2} maxLength={140} defaultValue={treatment?.name ?? ""} placeholder="Ex.: Restauração em resina" className="h-11 w-full rounded-xl border border-[#dce2df] px-3.5 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
            <label className="space-y-1.5 text-sm font-medium">Código<input name="code" maxLength={50} defaultValue={treatment?.code ?? ""} placeholder="REST-001" className="h-11 w-full rounded-xl border border-[#dce2df] px-3.5 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">Categoria<input name="category" maxLength={80} defaultValue={treatment?.category ?? ""} placeholder="Ex.: Dentística" className="h-11 w-full rounded-xl border border-[#dce2df] px-3.5 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
          <label className="block space-y-1.5 text-sm font-medium">Descrição clínica<textarea name="description" maxLength={1000} defaultValue={treatment?.description ?? ""} rows={3} placeholder="Orientações internas e escopo do procedimento" className="w-full resize-none rounded-xl border border-[#dce2df] px-3.5 py-3 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">Preço base (R$)<input name="basePrice" type="number" required min="0" step="0.01" defaultValue={treatment?.basePrice ?? 0} className="h-11 w-full rounded-xl border border-[#dce2df] px-3.5 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
            <label className="space-y-1.5 text-sm font-medium">Custo estimado (R$)<input name="costAmount" type="number" required min="0" step="0.01" defaultValue={treatment?.costAmount ?? 0} className="h-11 w-full rounded-xl border border-[#dce2df] px-3.5 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
            <label className="space-y-1.5 text-sm font-medium">Duração (min)<input name="estimatedMinutes" type="number" min="1" max="1440" step="1" defaultValue={treatment?.estimatedMinutes ?? ""} placeholder="60" className="h-11 w-full rounded-xl border border-[#dce2df] px-3.5 font-normal outline-none focus:border-[#176b55] focus:ring-4 focus:ring-[#176b55]/8" /></label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dce2df] bg-[#f8faf9] p-4"><input name="segmentedByTooth" type="checkbox" defaultChecked={treatment?.segmentedByTooth ?? false} className="mt-0.5 h-4 w-4 accent-[#176b55]" /><span><span className="block text-sm font-semibold">Segmentar por dente</span><span className="mt-0.5 block text-xs leading-5 text-[#68736f]">Use quando o tratamento precisa registrar dente, dentição ou faces no orçamento e no odontograma.</span></span></label>
          {state.status === "error" ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" aria-live="polite">{state.message}</p> : null}
          <div className="flex flex-col-reverse gap-3 border-t border-[#e2e7e4] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-11 rounded-xl border border-[#dce2df] px-5 text-sm font-semibold hover:bg-[#f7f9f8]">Cancelar</button><SubmitButton editing={Boolean(treatment)} /></div>
        </form>
      </div>
    </div>
  );
}

export function TreatmentCatalogWorkspace({ clinicName, userName, canManage, treatments, loadError }: { clinicName: string; userName: string; canManage: boolean; treatments: Treatment[]; loadError: string | null }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return treatments.filter((item) => {
      const matchesStatus = status === "all" || (status === "active" ? item.active : !item.active);
      const searchable = [item.name, item.code, item.category, item.description].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return matchesStatus && (!normalized || searchable.includes(normalized));
    });
  }, [query, status, treatments]);

  const activeCount = treatments.filter((item) => item.active).length;
  const categoriesCount = new Set(treatments.map((item) => item.category).filter(Boolean)).size;

  function openNew() { setEditing(null); setFormOpen(true); }
  function openEdit(item: Treatment) { setEditing(item); setFormOpen(true); }
  function closeForm() { setFormOpen(false); }

  return (
    <WorkspaceShell clinicName={clinicName} userName={userName}>
      <main className="min-w-0">
        <header className="flex min-h-[68px] items-center gap-3 border-b border-[#dce2df] bg-white px-4 py-3 sm:px-6"><button className="rounded-lg p-2 text-slate-600 lg:hidden" aria-label="Abrir menu"><Menu size={21} /></button><div><p className="text-xs font-medium text-[#68736f]">Administração clínica</p><h1 className="text-lg font-semibold tracking-[-.02em]">Catálogo de tratamentos</h1></div><button onClick={openNew} disabled={!canManage} className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-[#176b55] px-3.5 text-sm font-semibold text-white transition hover:bg-[#0f513f] disabled:cursor-not-allowed disabled:opacity-45"><Plus size={17} /><span className="hidden sm:inline">Novo tratamento</span></button></header>
        <section className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#dce2df] bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-[#68736f]"><Stethoscope size={16} />Tratamentos ativos</div><p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{activeCount}</p></div><div className="rounded-2xl border border-[#dce2df] bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-[#68736f]"><Tag size={16} />Categorias</div><p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{categoriesCount}</p></div><div className="rounded-2xl border border-[#dce2df] bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-[#68736f]"><Archive size={16} />Arquivados</div><p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{treatments.length - activeCount}</p></div></div>
          {!canManage ? <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="mt-0.5 shrink-0" size={18} /><span>Você pode consultar o catálogo. Alterações são restritas a proprietários e administradores da clínica.</span></div> : null}
          {loadError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</div> : null}
          <div className="overflow-hidden rounded-2xl border border-[#dce2df] bg-white shadow-[0_10px_35px_rgba(23,32,29,.04)]">
            <div className="flex flex-col gap-3 border-b border-[#e2e7e4] p-4 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Buscar no catálogo</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89928f]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, código ou categoria" className="h-10 w-full rounded-xl border border-[#dce2df] bg-[#f8faf9] pl-10 pr-4 text-sm outline-none focus:border-[#176b55] focus:bg-white focus:ring-4 focus:ring-[#176b55]/8" /></label><label><span className="sr-only">Filtrar por status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 w-full rounded-xl border border-[#dce2df] bg-white px-3 text-sm outline-none focus:border-[#176b55] sm:w-40"><option value="all">Todos</option><option value="active">Ativos</option><option value="archived">Arquivados</option></select></label></div>
            {filtered.length ? <div className="divide-y divide-[#edf0ee]">{filtered.map((item) => <article key={item.publicId} className="grid gap-4 p-4 transition hover:bg-[#fbfcfb] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold tracking-[-.015em]">{item.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "Ativo" : "Arquivado"}</span>{item.segmentedByTooth ? <span className="rounded-full bg-[#eef8f4] px-2.5 py-1 text-[10px] font-semibold text-[#176b55]">Por dente</span> : null}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#68736f]">{item.code ? <span>{item.code}</span> : null}{item.category ? <span>{item.category}</span> : null}{item.estimatedMinutes ? <span className="flex items-center gap-1"><Clock3 size={13} />{item.estimatedMinutes} min</span> : null}</div>{item.description ? <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[#65716d]">{item.description}</p> : null}<div className="mt-3 flex flex-wrap gap-4 text-sm"><span><span className="text-[#7b8581]">Preço </span><strong>{currency.format(item.basePrice)}</strong></span><span><span className="text-[#7b8581]">Custo </span><strong>{currency.format(item.costAmount)}</strong></span></div></div>{canManage ? <div className="flex gap-2 sm:justify-end"><button onClick={() => openEdit(item)} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#dce2df] px-3 text-xs font-semibold hover:bg-[#f5f7f6]"><Edit3 size={14} />Editar</button><form action={setTreatmentActive.bind(null, item.publicId, !item.active)}><button className="flex h-9 items-center gap-1.5 rounded-xl border border-[#dce2df] px-3 text-xs font-semibold hover:bg-[#f5f7f6]">{item.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}{item.active ? "Arquivar" : "Reativar"}</button></form></div> : null}</article>)}</div> : <div className="grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef3f1] text-[#176b55]"><PackageOpen size={23} /></span><h2 className="mt-4 font-semibold">{treatments.length ? "Nenhum tratamento encontrado" : "Seu catálogo começa aqui"}</h2><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#68736f]">{treatments.length ? "Ajuste a busca ou o filtro para encontrar outro item." : "Cadastre tratamentos com preço, custo, duração e regras de segmentação prontas para os próximos orçamentos."}</p>{canManage && !treatments.length ? <button onClick={openNew} className="mt-4 rounded-xl bg-[#176b55] px-4 py-2.5 text-sm font-semibold text-white">Adicionar primeiro tratamento</button> : null}</div></div>}
          </div>
        </section>
      </main>
      {formOpen ? <TreatmentForm key={editing?.publicId ?? "new"} treatment={editing} onClose={closeForm} /> : null}
    </WorkspaceShell>
  );
}
