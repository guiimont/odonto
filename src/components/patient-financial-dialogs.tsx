"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleDollarSign, FileText, Plus, Trash2, X } from "lucide-react";
import { approvePatientBudget, createPatientBudget, receiveInstallmentPayment } from "@/app/patients/[publicId]/actions";

type CatalogItem = { public_id: string; name: string; base_price: number; segmented_by_tooth: boolean };
type PaymentMethod = { public_id: string; display_name: string; kind: string };
type Installment = { public_id: string; amount: number; paid_amount: number; sequence_number: number; total_installments: number };
type Budget = { public_id: string; description: string; total_amount: number; entry_amount: number; remaining_installments_count: number };
type ToothSet = "permanent" | "deciduous";
type BudgetSeed = { sourcePublicId: string; description: string; toothCode: number; toothSet: ToothSet; surfaces: string[] };
type BudgetLine = { id: string; catalog_public_id: string | null; source_odontogram_public_id: string | null; name: string; quantity: number; unit_price: number; tooth_code: string; tooth_set: ToothSet; surfaces: string[] };

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Modal({ publicId, eyebrow, title, icon: Icon, children }: { publicId: string; eyebrow: string; title: string; icon: typeof FileText; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0e1815]/60 p-3 backdrop-blur-sm sm:p-6">
    <div className="mx-auto my-3 w-full max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-2xl sm:my-8">
      <header className="flex items-start gap-3 border-b border-[#e3e8e5] px-5 py-4 sm:px-7 sm:py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f1ed] text-[#176b55]"><Icon size={19} /></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#176b55]">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">{title}</h2></div>
        <Link href={`/patients/${publicId}`} className="grid h-9 w-9 place-items-center rounded-xl text-[#6f7b77] hover:bg-slate-100" aria-label="Fechar"><X size={18} /></Link>
      </header>
      {children}
    </div>
  </div>;
}

function newLine(id = crypto.randomUUID()): BudgetLine {
  return { id, catalog_public_id: null, source_odontogram_public_id: null, name: "", quantity: 1, unit_price: 0, tooth_code: "", tooth_set: "permanent", surfaces: [] };
}

function seededLine(seed: BudgetSeed, catalog: CatalogItem[]): BudgetLine {
  const matchingCatalog = catalog.find((item) => item.name.trim().toLocaleLowerCase("pt-BR") === seed.description.trim().toLocaleLowerCase("pt-BR"));
  return {
    id: "clinical-source",
    catalog_public_id: matchingCatalog?.public_id ?? null,
    source_odontogram_public_id: seed.sourcePublicId,
    name: matchingCatalog?.name ?? seed.description,
    quantity: 1,
    unit_price: Number(matchingCatalog?.base_price ?? 0),
    tooth_code: String(seed.toothCode),
    tooth_set: seed.toothSet,
    surfaces: seed.surfaces,
  };
}

export function PatientFinancialDialogs({ publicId, panel, catalog, paymentMethods, installment, budget, budgetSeed, today }: {
  publicId: string;
  panel?: string;
  catalog: CatalogItem[];
  paymentMethods: PaymentMethod[];
  installment: Installment | null;
  budget: Budget | null;
  budgetSeed: BudgetSeed | null;
  today: string;
}) {
  const [lines, setLines] = useState<BudgetLine[]>(() => [budgetSeed ? seededLine(budgetSeed, catalog) : newLine("initial-line")]);
  const [discountType, setDiscountType] = useState<"fixed_amount" | "percentage">("fixed_amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [entryAmount, setEntryAmount] = useState(0);
  const [installmentCount, setInstallmentCount] = useState(1);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Math.max(0, line.quantity) * Math.max(0, line.unit_price), 0), [lines]);
  const discount = discountType === "percentage" ? subtotal * Math.min(100, Math.max(0, discountValue)) / 100 : Math.min(subtotal, Math.max(0, discountValue));
  const total = Math.max(0, subtotal - discount);
  const serializedLines = JSON.stringify(lines.map((line) => ({
    catalog_public_id: line.catalog_public_id,
    name: line.name,
    quantity: Number(line.quantity),
    unit_price: Number(line.unit_price),
    tooth_code: line.tooth_code ? Number(line.tooth_code) : null,
    tooth_set: line.tooth_set,
    surfaces: line.surfaces,
    source_odontogram_public_id: line.source_odontogram_public_id,
  })));

  function updateLine(id: string, patch: Partial<BudgetLine>) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  }

  if (panel === "budget") {
    const action = createPatientBudget.bind(null, publicId);
    return <Modal publicId={publicId} eyebrow="Plano de tratamento" title="Novo orçamento" icon={FileText}>
      <form action={action}>
        <input type="hidden" name="items" value={serializedLines} />
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Identificação do plano *</span><input name="description" required minLength={2} maxLength={200} defaultValue={budgetSeed ? `Plano de tratamento — dente ${budgetSeed.toothCode}` : ""} placeholder="Ex.: Reabilitação superior — fase 1" className="auth-input" /></label>
          </div>
          {budgetSeed ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#cfe1d9] bg-[#edf6f2] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#176b55] text-xs font-black text-white">{budgetSeed.toothCode}</span><div><p className="text-xs font-bold text-[#145d4b]">Procedimento importado do odontograma</p><p className="mt-1 text-[11px] leading-5 text-[#60716a]">Dente, dentição, faces e descrição clínica foram preservados. Selecione o procedimento do catálogo para aplicar o valor padrão.</p></div></div> : null}
          <div className="mt-6 flex items-center justify-between"><div><p className="text-sm font-semibold">Procedimentos</p><p className="mt-1 text-xs text-[#7a8581]">O nome e o preço ficam preservados como fotografia histórica.</p></div><button type="button" onClick={() => setLines((current) => [...current, newLine()])} className="flex h-9 items-center gap-2 rounded-xl border border-[#dce2df] px-3 text-xs font-semibold"><Plus size={14} />Adicionar</button></div>
          <div className="mt-3 space-y-3">{lines.map((line, index) => <div key={line.id} className="rounded-2xl border border-[#dce2df] bg-[#fafbfa] p-4">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#71807b]">Item {index + 1}</p>{lines.length > 1 ? <button type="button" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label={`Remover item ${index + 1}`}><Trash2 size={15} /></button> : null}</div>
            <div className="mt-3 grid gap-3 md:grid-cols-12">
              <label className="md:col-span-5"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Procedimento *</span><select value={line.catalog_public_id ?? ""} onChange={(event) => { const selected = catalog.find((item) => item.public_id === event.target.value); updateLine(line.id, selected ? { catalog_public_id: selected.public_id, name: selected.name, unit_price: Number(selected.base_price) } : { catalog_public_id: null }); }} className="auth-input"><option value="">Personalizado</option>{catalog.map((item) => <option key={item.public_id} value={item.public_id}>{item.name}</option>)}</select></label>
              <label className="md:col-span-7"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Descrição *</span><input required minLength={2} maxLength={240} value={line.name} onChange={(event) => updateLine(line.id, { name: event.target.value })} className="auth-input" /></label>
              <label className="md:col-span-1"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Qtd.</span><input type="number" min="0.01" max="100" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} className="auth-input" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Valor unitário</span><input type="number" min="0" step="0.01" value={line.unit_price} onChange={(event) => updateLine(line.id, { unit_price: Number(event.target.value) })} className="auth-input" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Dentição</span><select value={line.tooth_set} onChange={(event) => updateLine(line.id, { tooth_set: event.target.value as ToothSet, source_odontogram_public_id: null })} className="auth-input"><option value="permanent">Permanente</option><option value="deciduous">Decídua</option></select></label>
              <label className="md:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Dente FDI</span><input inputMode="numeric" minLength={2} maxLength={2} placeholder="16" value={line.tooth_code} onChange={(event) => updateLine(line.id, { tooth_code: event.target.value.replace(/\D/g, "").slice(0, 2), source_odontogram_public_id: null })} className="auth-input" /></label>
              <label className="md:col-span-3"><span className="mb-1 block text-[11px] font-semibold text-[#61706b]">Faces</span><select value={line.surfaces.length === 1 ? line.surfaces[0] : ""} onChange={(event) => updateLine(line.id, { surfaces: event.target.value ? [event.target.value] : [], source_odontogram_public_id: null })} className="auth-input"><option value="">{line.surfaces.length > 1 ? line.surfaces.length + " faces do odontograma" : "Não especificada"}</option><option value="mesial">Mesial</option><option value="occlusal_incisal">Oclusal / incisal</option><option value="distal">Distal</option><option value="vestibular">Vestibular</option><option value="lingual_palatal">Lingual / palatina</option><option value="cervical">Cervical</option><option value="all">Dente inteiro</option></select></label>
              <div className="flex items-end justify-end md:col-span-2"><span className="pb-3 text-sm font-semibold">{currency.format(line.quantity * line.unit_price)}</span></div>
            </div>
          </div>)}</div>
          <div className="mt-6 grid gap-4 rounded-2xl bg-[#17201d] p-5 text-white lg:grid-cols-[1fr_280px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-[11px] font-semibold text-white/60">Tipo de desconto</span><select name="discount_type" value={discountType} onChange={(event) => setDiscountType(event.target.value as typeof discountType)} className="auth-input text-[#17201d]"><option value="fixed_amount">Valor em reais</option><option value="percentage">Percentual</option></select></label>
              <label><span className="mb-1 block text-[11px] font-semibold text-white/60">Desconto</span><input name="discount_value" type="number" min="0" max={discountType === "percentage" ? 100 : undefined} step="0.01" value={discountValue} onChange={(event) => setDiscountValue(Number(event.target.value))} className="auth-input text-[#17201d]" /></label>
              <label><span className="mb-1 block text-[11px] font-semibold text-white/60">Entrada</span><input name="entry_amount" type="number" min="0" max={total} step="0.01" value={entryAmount} onChange={(event) => setEntryAmount(Number(event.target.value))} className="auth-input text-[#17201d]" /></label>
              <label><span className="mb-1 block text-[11px] font-semibold text-white/60">Parcelas restantes</span><input name="installment_count" type="number" min="0" max="60" value={installmentCount} onChange={(event) => setInstallmentCount(Number(event.target.value))} className="auth-input text-[#17201d]" /></label>
              <label><span className="mb-1 block text-[11px] font-semibold text-white/60">Primeiro vencimento</span><input name="first_due_date" type="date" required={installmentCount > 0} min={today} defaultValue={today} className="auth-input text-[#17201d]" /></label>
              <label><span className="mb-1 block text-[11px] font-semibold text-white/60">Observações</span><input name="observations" maxLength={4000} className="auth-input text-[#17201d]" /></label>
            </div>
            <div className="rounded-2xl bg-white/8 p-4"><div className="flex justify-between text-xs text-white/60"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div><div className="mt-2 flex justify-between text-xs text-white/60"><span>Desconto</span><span>− {currency.format(discount)}</span></div><div className="mt-4 border-t border-white/10 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/45">Total do plano</p><p className="mt-1 text-3xl font-semibold tracking-[-.05em]">{currency.format(total)}</p><p className="mt-2 text-[11px] text-white/50">Saldo após entrada: {currency.format(Math.max(0, total - entryAmount))}</p></div></div>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#e3e8e5] bg-[#fafbfa] px-5 py-4 sm:px-7"><Link href={`/patients/${publicId}`} className="flex h-10 items-center rounded-xl border border-[#dce2df] bg-white px-4 text-sm font-semibold text-[#61706b]">Cancelar</Link><button disabled={total <= 0 || entryAmount > total} className="h-10 rounded-xl bg-[#176b55] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Criar plano para aprovação</button></footer>
      </form>
    </Modal>;
  }

  if (panel === "payment" && installment) {
    const action = receiveInstallmentPayment.bind(null, publicId);
    const outstanding = Number(installment.amount) - Number(installment.paid_amount);
    return <Modal publicId={publicId} eyebrow="Financeiro do paciente" title={`Receber parcela ${installment.sequence_number}/${installment.total_installments}`} icon={CircleDollarSign}>
      <form action={action}>
        <input type="hidden" name="installment_public_id" value={installment.public_id} />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <div className="rounded-2xl bg-[#edf3f0] p-4 sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#176b55]">Saldo desta parcela</p><p className="mt-1 text-3xl font-semibold tracking-[-.05em] text-[#17201d]">{currency.format(outstanding)}</p></div>
          <label><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Forma de pagamento *</span><select name="payment_method_public_id" required className="auth-input"><option value="">Selecione</option>{paymentMethods.map((method) => <option key={method.public_id} value={method.public_id}>{method.display_name}</option>)}</select></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Valor recebido *</span><input name="amount" type="number" required min="0.01" max={outstanding} step="0.01" defaultValue={outstanding.toFixed(2)} className="auth-input" /></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Parcelamento no cartão</span><input name="card_installments" type="number" min="1" max="24" defaultValue="1" className="auth-input" /></label>
          <label><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Observações</span><input name="observations" maxLength={2000} className="auth-input" /></label>
          <p className="text-xs leading-5 text-[#71807b] sm:col-span-2">PIX e dinheiro são liquidados imediatamente. Cartões e boleto ficam como aguardando repasse até a data prevista.</p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#e3e8e5] bg-[#fafbfa] px-5 py-4 sm:px-7"><Link href={`/patients/${publicId}`} className="flex h-10 items-center rounded-xl border border-[#dce2df] bg-white px-4 text-sm font-semibold text-[#61706b]">Cancelar</Link><button className="h-10 rounded-xl bg-[#176b55] px-5 text-sm font-semibold text-white">Confirmar recebimento</button></footer>
      </form>
    </Modal>;
  }

  if (panel === "approve" && budget) {
    const action = approvePatientBudget.bind(null, publicId);
    const financed = Math.max(0, Number(budget.total_amount) - Number(budget.entry_amount));
    return <Modal publicId={publicId} eyebrow="Aprovação financeira" title="Confirmar plano de tratamento" icon={FileText}>
      <form action={action}>
        <input type="hidden" name="budget_public_id" value={budget.public_id} />
        <div className="p-5 sm:p-7">
          <div className="rounded-2xl border border-[#dce2df] bg-[#fafbfa] p-5"><p className="text-xs font-semibold text-[#52605b]">{budget.description}</p><p className="mt-2 text-3xl font-semibold tracking-[-.05em] text-[#17201d]">{currency.format(Number(budget.total_amount))}</p><div className="mt-4 grid gap-3 text-xs text-[#61706b] sm:grid-cols-2"><p><span className="block text-[10px] uppercase tracking-[.1em] text-[#84908b]">Entrada</span><strong className="mt-1 block text-[#35423e]">{currency.format(Number(budget.entry_amount))}</strong></p><p><span className="block text-[10px] uppercase tracking-[.1em] text-[#84908b]">Saldo parcelado</span><strong className="mt-1 block text-[#35423e]">{currency.format(financed)} em {budget.remaining_installments_count || (financed > 0 ? 1 : 0)} parcela(s)</strong></p></div></div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">Ao confirmar, o plano será aprovado e os recebíveis serão gerados. A operação é idempotente: cliques repetidos não duplicam parcelas.</div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#e3e8e5] bg-[#fafbfa] px-5 py-4 sm:px-7"><Link href={`/patients/${publicId}`} className="flex h-10 items-center rounded-xl border border-[#dce2df] bg-white px-4 text-sm font-semibold text-[#61706b]">Voltar</Link><button className="h-10 rounded-xl bg-[#176b55] px-5 text-sm font-semibold text-white">Confirmar aprovação</button></footer>
      </form>
    </Modal>;
  }

  return null;
}
