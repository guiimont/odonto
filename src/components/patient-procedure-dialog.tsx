import Link from "next/link";
import { CheckCircle2, Stethoscope, X } from "lucide-react";
import { completeClinicalProcedure } from "@/app/patients/[publicId]/actions";

type ClinicalProcedure = {
  public_id: string;
  treatment_name_snapshot: string;
  charged_amount: number;
  status: string;
};

export function PatientProcedureDialog({ publicId, procedure, today, currentTime }: {
  publicId: string;
  procedure: ClinicalProcedure | null;
  today: string;
  currentTime: string;
}) {
  if (!procedure) return null;
  const action = completeClinicalProcedure.bind(null, publicId);

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0e1815]/60 p-3 backdrop-blur-sm sm:p-6">
    <div className="mx-auto my-3 w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl sm:my-8">
      <header className="flex items-start gap-3 border-b border-[#e3e8e5] px-5 py-4 sm:px-7 sm:py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Stethoscope size={19} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#176b55]">Execução clínica</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">Concluir procedimento</h2>
          <p className="mt-1 truncate text-xs text-[#6f7b77]">{procedure.treatment_name_snapshot}</p>
        </div>
        <Link href={`/patients/${publicId}`} className="grid h-9 w-9 place-items-center rounded-xl text-[#6f7b77] hover:bg-slate-100" aria-label="Fechar"><X size={18} /></Link>
      </header>
      <form action={action}>
        <input type="hidden" name="procedure_public_id" value={procedure.public_id} />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:col-span-2">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={18} /><div><p className="text-sm font-semibold text-emerald-950">Um único registro fecha todo o ciclo</p><p className="mt-1 text-xs leading-5 text-emerald-800">A evolução será assinada, o odontograma atualizado e o repasse profissional provisionado automaticamente.</p></div></div>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Data do atendimento *</span><input name="occurred_date" type="date" required max={today} defaultValue={today} className="auth-input" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Horário *</span><input name="occurred_time" type="time" required defaultValue={currentTime} className="auth-input" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Evolução e conduta *</span><textarea name="description" required minLength={3} rows={8} placeholder="Registre o procedimento realizado, materiais, anestésico, intercorrências e orientações pós-operatórias." className="w-full resize-y rounded-xl border border-[#dce2df] bg-[#f8faf9] p-3.5 text-sm leading-6 outline-none focus:border-[#176b55]" /></label>
          <p className="text-[11px] leading-5 text-[#6f7b77] sm:col-span-2">Ao concluir, este registro clínico será assinado e ficará imutável. Correções posteriores exigem evolução complementar.</p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#e3e8e5] bg-[#fafbfa] px-5 py-4 sm:px-7">
          <Link href={`/patients/${publicId}`} className="flex h-10 items-center rounded-xl border border-[#dce2df] bg-white px-4 text-sm font-semibold text-[#61706b]">Cancelar</Link>
          <button className="h-10 rounded-xl bg-[#176b55] px-5 text-sm font-semibold text-white hover:bg-[#0f513f]">Assinar e concluir</button>
        </footer>
      </form>
    </div>
  </div>;
}
