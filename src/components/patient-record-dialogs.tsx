import Link from "next/link";
import { AlertTriangle, ClipboardCheck, FilePenLine, ShieldAlert, Stethoscope, X } from "lucide-react";
import { OdontogramFaceSelector } from "@/components/odontogram-face-selector";
import {
  createClinicalEvolution,
  createMedicalAlert,
  createOdontogramEntry,
  submitAnamnesis,
  updatePatient,
} from "@/app/patients/[publicId]/actions";

type PatientFormData = {
  full_name: string;
  social_name: string | null;
  birth_date: string | null;
  gender: string | null;
  cpf_digits: string | null;
  phone_e164: string | null;
  whatsapp_e164: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code_digits: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone_e164: string | null;
  notes: string | null;
};

type Question = { public_id: string; position: number; prompt: string; required: boolean };
type ExistingAnswer = { question_id: number; selection: string | null; answer_text: string | null };

function phoneForInput(value: string | null) {
  return value?.replace(/^\+55/, "") ?? "";
}

function Modal({ title, eyebrow, icon: Icon, publicId, children }: {
  title: string;
  eyebrow: string;
  icon: typeof FilePenLine;
  publicId: string;
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0e1815]/60 p-3 backdrop-blur-sm sm:p-6">
    <div className="mx-auto my-3 w-full max-w-3xl overflow-hidden rounded-[24px] bg-white shadow-2xl sm:my-8">
      <header className="flex items-start gap-3 border-b border-[#e3e8e5] px-5 py-4 sm:px-7 sm:py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f1ed] text-[#176b55]"><Icon size={19} /></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#176b55]">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">{title}</h2></div>
        <Link href={`/patients/${publicId}`} className="grid h-9 w-9 place-items-center rounded-xl text-[#6f7b77] hover:bg-slate-100" aria-label="Fechar"><X size={18} /></Link>
      </header>
      {children}
    </div>
  </div>;
}

function Footer({ publicId, label }: { publicId: string; label: string }) {
  return <footer className="flex justify-end gap-2 border-t border-[#e3e8e5] bg-[#fafbfa] px-5 py-4 sm:px-7">
    <Link href={`/patients/${publicId}`} className="flex h-10 items-center rounded-xl border border-[#dce2df] bg-white px-4 text-sm font-semibold text-[#61706b]">Cancelar</Link>
    <button className="h-10 rounded-xl bg-[#176b55] px-5 text-sm font-semibold text-white hover:bg-[#0f513f]">{label}</button>
  </footer>;
}

const Field = ({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) => <label className={wide ? "block sm:col-span-2" : "block"}><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">{label}</span>{children}</label>;

export function PatientRecordDialogs({ publicId, panel, selectedTooth, selectedDentition, patient, questions, existingAnswers, answerQuestionIds, today, currentTime }: {
  publicId: string;
  panel?: string;
  selectedTooth?: string;
  selectedDentition?: string;
  patient: PatientFormData;
  questions: Question[];
  existingAnswers: ExistingAnswer[];
  answerQuestionIds: Record<number, string>;
  today: string;
  currentTime: string;
}) {
  if (!panel) return null;

  if (panel === "edit") {
    const action = updatePatient.bind(null, publicId);
    return <Modal title="Dados do paciente" eyebrow="Cadastro" icon={FilePenLine} publicId={publicId}>
      <form action={action}>
        <div className="grid max-h-[68vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Nome completo *" wide><input name="full_name" required minLength={2} defaultValue={patient.full_name} className="auth-input" /></Field>
          <Field label="Nome social"><input name="social_name" defaultValue={patient.social_name ?? ""} className="auth-input" /></Field>
          <Field label="Data de nascimento"><input name="birth_date" type="date" max={today} defaultValue={patient.birth_date ?? ""} className="auth-input" /></Field>
          <Field label="Gênero"><select name="gender" defaultValue={patient.gender ?? ""} className="auth-input"><option value="">Não informado</option><option value="female">Feminino</option><option value="male">Masculino</option><option value="non_binary">Não binário</option><option value="other">Outro</option><option value="prefer_not_to_say">Prefere não informar</option></select></Field>
          <Field label="CPF"><input name="cpf" inputMode="numeric" defaultValue={patient.cpf_digits ?? ""} placeholder="000.000.000-00" className="auth-input" /></Field>
          <Field label="Telefone"><input name="phone" type="tel" defaultValue={phoneForInput(patient.phone_e164)} placeholder="(11) 99999-9999" className="auth-input" /></Field>
          <Field label="WhatsApp"><input name="whatsapp" type="tel" defaultValue={phoneForInput(patient.whatsapp_e164)} placeholder="(11) 99999-9999" className="auth-input" /></Field>
          <Field label="E-mail"><input name="email" type="email" defaultValue={patient.email ?? ""} className="auth-input" /></Field>
          <Field label="CEP"><input name="postal_code" inputMode="numeric" defaultValue={patient.postal_code_digits ?? ""} placeholder="00000-000" className="auth-input" /></Field>
          <Field label="Endereço" wide><input name="address_line1" defaultValue={patient.address_line1 ?? ""} placeholder="Rua, número" className="auth-input" /></Field>
          <Field label="Complemento"><input name="address_line2" defaultValue={patient.address_line2 ?? ""} className="auth-input" /></Field>
          <Field label="Bairro"><input name="neighborhood" defaultValue={patient.neighborhood ?? ""} className="auth-input" /></Field>
          <Field label="Cidade"><input name="city" defaultValue={patient.city ?? ""} className="auth-input" /></Field>
          <Field label="UF"><input name="state" maxLength={2} defaultValue={patient.state ?? ""} className="auth-input uppercase" /></Field>
          <Field label="Contato de emergência"><input name="emergency_contact_name" defaultValue={patient.emergency_contact_name ?? ""} className="auth-input" /></Field>
          <Field label="Telefone de emergência"><input name="emergency_contact_phone" type="tel" defaultValue={phoneForInput(patient.emergency_contact_phone_e164)} className="auth-input" /></Field>
          <Field label="Observações cadastrais" wide><textarea name="notes" rows={4} defaultValue={patient.notes ?? ""} className="w-full resize-y rounded-xl border border-[#dce2df] bg-[#f8faf9] p-3.5 text-sm outline-none focus:border-[#176b55]" /></Field>
        </div>
        <Footer publicId={publicId} label="Salvar alterações" />
      </form>
    </Modal>;
  }

  if (panel === "alert") {
    const action = createMedicalAlert.bind(null, publicId);
    return <Modal title="Novo alerta médico" eyebrow="Segurança clínica" icon={ShieldAlert} publicId={publicId}>
      <form action={action}>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Tipo de alerta *"><select name="alert_type" required className="auth-input"><option value="allergy">Alergia</option><option value="medication">Medicamento em uso</option><option value="condition">Condição sistêmica</option><option value="bleeding">Risco de sangramento</option><option value="cardiac">Condição cardíaca</option><option value="other">Outro</option></select></Field>
          <Field label="Criticidade *"><select name="severity" required defaultValue="warning" className="auth-input"><option value="info">Informativo</option><option value="warning">Atenção</option><option value="critical">Crítico</option></select></Field>
          <Field label="Descrição objetiva *" wide><textarea name="description" required minLength={3} rows={5} placeholder="Ex.: Alergia confirmada a penicilina. Evitar prescrição." className="w-full resize-y rounded-xl border border-[#dce2df] bg-[#f8faf9] p-3.5 text-sm outline-none focus:border-[#176b55]" /></Field>
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 sm:col-span-2"><AlertTriangle size={17} className="mt-0.5 shrink-0" />O alerta aparecerá na agenda e no topo do prontuário antes do atendimento.</div>
        </div>
        <Footer publicId={publicId} label="Registrar alerta" />
      </form>
    </Modal>;
  }

  if (panel === "odontogram") {
    const action = createOdontogramEntry.bind(null, publicId);
    return <Modal title="Registrar no odontograma" eyebrow="Odontologia FDI" icon={Stethoscope} publicId={publicId}>
      <form action={action}>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Dentição *"><select name="tooth_set" defaultValue={selectedDentition === "deciduous" ? "deciduous" : "permanent"} className="auth-input"><option value="permanent">Permanente</option><option value="deciduous">Decídua</option></select></Field>
          <Field label="Dente FDI *"><input name="tooth_code" required inputMode="numeric" defaultValue={selectedTooth ?? ""} minLength={2} maxLength={2} placeholder="Ex.: 16" className="auth-input" /></Field>
          <Field label="Tipo de registro *" wide><select name="entry_kind" defaultValue="condition" className="auth-input"><option value="diagnosis">Diagnóstico</option><option value="condition">Condição atual</option><option value="planned_procedure">Procedimento planejado</option><option value="executed_procedure">Procedimento executado</option></select></Field>
          <OdontogramFaceSelector />
          <Field label="Descrição clínica *" wide><textarea name="description" required minLength={3} rows={5} placeholder="Descreva o achado, diagnóstico ou procedimento sem abreviações ambíguas." className="w-full resize-y rounded-xl border border-[#dce2df] bg-[#f8faf9] p-3.5 text-sm outline-none focus:border-[#176b55]" /></Field>
        </div>
        <Footer publicId={publicId} label="Salvar registro" />
      </form>
    </Modal>;
  }

  if (panel === "evolution") {
    const action = createClinicalEvolution.bind(null, publicId);
    return <Modal title="Nova evolução clínica" eyebrow="Registro assistencial" icon={ClipboardCheck} publicId={publicId}>
      <form action={action}>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Data do atendimento *"><input name="occurred_date" type="date" required max={today} defaultValue={today} className="auth-input" /></Field>
          <Field label="Horário *"><input name="occurred_time" type="time" required defaultValue={currentTime} className="auth-input" /></Field>
          <Field label="Evolução *" wide><textarea name="description" required minLength={3} rows={8} placeholder="Registre queixa, avaliação, conduta, materiais utilizados, orientações e intercorrências." className="w-full resize-y rounded-xl border border-[#dce2df] bg-[#f8faf9] p-3.5 text-sm leading-6 outline-none focus:border-[#176b55]" /></Field>
          <label className="flex items-start gap-3 rounded-xl border border-[#dce2df] bg-[#f8faf9] p-4 sm:col-span-2"><input name="sign_now" type="checkbox" defaultChecked className="mt-0.5 accent-[#176b55]" /><span><span className="block text-xs font-semibold">Assinar e finalizar agora</span><span className="mt-1 block text-[11px] leading-4 text-[#6f7b77]">Após a assinatura o conteúdo fica imutável. Correções exigirão um registro complementar.</span></span></label>
        </div>
        <Footer publicId={publicId} label="Registrar evolução" />
      </form>
    </Modal>;
  }

  if (panel === "anamnesis") {
    const action = submitAnamnesis.bind(null, publicId);
    const existingByQuestion = new Map(existingAnswers.map((answer) => [answerQuestionIds[answer.question_id], answer]));
    return <Modal title="Revisar anamnese" eyebrow="Avaliação de risco" icon={ClipboardCheck} publicId={publicId}>
      <form action={action}>
        <input type="hidden" name="question_ids" value={JSON.stringify(questions.map((question) => question.public_id))} />
        <div className="max-h-[68vh] space-y-3 overflow-y-auto p-5 sm:p-7">{questions.map((question) => { const prior = existingByQuestion.get(question.public_id); return <fieldset key={question.public_id} className="rounded-2xl border border-[#dce2df] p-4"><legend className="px-1 text-sm font-semibold text-[#35423e]">{question.position}. {question.prompt}{question.required ? " *" : ""}</legend><div className="mt-3 flex flex-wrap gap-2">{[["no","Não"],["yes","Sim"],["unknown","Não sabe"]].map(([value,label]) => <label key={value} className="flex items-center gap-2 rounded-xl border border-[#dce2df] bg-[#fafbfa] px-3 py-2 text-xs font-medium"><input type="radio" name={`selection_${question.public_id}`} value={value} required={question.required} defaultChecked={prior?.selection === value} className="accent-[#176b55]" />{label}</label>)}</div><input name={`note_${question.public_id}`} defaultValue={prior?.answer_text ?? ""} placeholder="Detalhes, quando necessário" className="auth-input mt-3" /></fieldset>; })}
          <label className="flex items-center gap-2 rounded-xl bg-[#edf3f0] p-3 text-xs font-medium text-[#52605b]"><input type="checkbox" name="answered_by_patient" className="accent-[#176b55]" />Respostas informadas diretamente pelo paciente</label>
        </div>
        <Footer publicId={publicId} label="Concluir anamnese" />
      </form>
    </Modal>;
  }

  return null;
}
