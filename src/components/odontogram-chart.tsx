"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, CheckCircle2, CircleDot, Plus, Stethoscope } from "lucide-react";

type ToothSet = "permanent" | "deciduous";
type Surface = "mesial" | "occlusal_incisal" | "distal" | "vestibular" | "lingual_palatal" | "cervical" | "all";
type Entry = {
  id: number;
  tooth_code: number | null;
  tooth_set: ToothSet | null;
  surfaces: Surface[];
  entry_kind: "diagnosis" | "condition" | "planned_procedure" | "executed_procedure";
  status: string;
  description: string;
  occurred_at: string;
};

const permanentUpper = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const permanentLower = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const deciduousUpper = [55,54,53,52,51,61,62,63,64,65];
const deciduousLower = [85,84,83,82,81,71,72,73,74,75];
const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function toothTone(entry?: Entry) {
  if (!entry) return "text-[#8c9994]";
  if (entry.entry_kind === "executed_procedure" || entry.status === "completed") return "text-emerald-600";
  if (entry.entry_kind === "diagnosis") return "text-rose-600";
  if (entry.entry_kind === "planned_procedure") return "text-sky-600";
  return "text-amber-600";
}

function ToothSilhouette({ code, upper }: { code: number; upper: boolean }) {
  const position = code % 10;
  const molar = position >= 6 || (code >= 50 && position >= 4);
  const premolar = !molar && position >= 4;
  const canine = position === 3;
  const crown = molar
    ? "M8 16 Q8 7 15 7 Q20 3 25 7 Q32 7 32 16 L30 27 Q20 31 10 27 Z"
    : premolar
      ? "M10 17 Q11 8 18 7 Q20 3 22 7 Q29 8 30 17 L28 27 Q20 30 12 27 Z"
      : canine
        ? "M12 18 Q13 10 17 9 L20 3 L23 9 Q27 10 28 18 L27 27 Q20 30 13 27 Z"
        : "M12 17 Q12 8 20 7 Q28 8 28 17 L27 27 Q20 30 13 27 Z";
  const roots = molar
    ? "M11 27 C10 37 7 48 11 55 C16 48 17 38 20 30 C23 38 24 48 29 55 C33 48 30 37 29 27"
    : premolar
      ? "M13 27 C14 38 15 50 20 56 C25 50 26 38 27 27"
      : "M14 27 C15 40 16 51 20 57 C24 51 25 40 26 27";
  return <svg aria-hidden="true" viewBox="0 0 40 60" className={`h-12 w-9 transition-transform duration-200 ${upper ? "rotate-180" : ""}`}>
    <path d={crown} fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d={roots} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {molar ? <path d="M14 16 Q20 21 26 16" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" /> : null}
  </svg>;
}

function FaceMap({ surfaces, tone }: { surfaces: Surface[]; tone: string }) {
  const all = surfaces.includes("all");
  const active = (surface: Surface) => all || surfaces.includes(surface);
  const fill = (surface: Surface) => active(surface) ? "currentColor" : "transparent";
  return <svg aria-hidden="true" viewBox="0 0 36 36" className={`h-8 w-8 ${tone}`}>
    <rect x="1.5" y="1.5" width="33" height="33" rx="12" fill="white" stroke="currentColor" strokeOpacity=".45" />
    <path d="M5 7 L13 14 L13 22 L5 29 Q1 18 5 7Z" fill={fill("mesial")} fillOpacity=".35" stroke="currentColor" strokeOpacity=".5" />
    <path d="M31 7 L23 14 L23 22 L31 29 Q35 18 31 7Z" fill={fill("distal")} fillOpacity=".35" stroke="currentColor" strokeOpacity=".5" />
    <path d="M7 5 L14 13 L22 13 L29 5 Q18 1 7 5Z" fill={fill("vestibular")} fillOpacity=".35" stroke="currentColor" strokeOpacity=".5" />
    <path d="M7 31 L14 23 L22 23 L29 31 Q18 35 7 31Z" fill={fill("lingual_palatal")} fillOpacity=".35" stroke="currentColor" strokeOpacity=".5" />
    <rect x="13" y="13" width="10" height="10" rx="3" fill={fill("occlusal_incisal")} fillOpacity=".55" stroke="currentColor" strokeWidth="1.2" />
    {active("cervical") ? <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" /> : null}
  </svg>;
}

function Tooth({ code, upper, entry, selected, onSelect }: { code: number; upper: boolean; entry?: Entry; selected: boolean; onSelect: () => void }) {
  const tone = toothTone(entry);
  const label = entry ? `Dente ${code}: ${entry.description}` : `Dente ${code}: sem registros`;
  return <button type="button" onClick={onSelect} aria-label={label} aria-pressed={selected} title={label} className={`group flex min-w-0 flex-col items-center rounded-xl px-1.5 py-2 outline-none transition ${selected ? "bg-[#e7f1ed] ring-2 ring-[#176b55]/30" : "hover:bg-[#f4f7f5] focus-visible:ring-2 focus-visible:ring-[#176b55]/40"}`}>
    {upper ? <ToothSilhouette code={code} upper /> : <span className={`mb-1 text-[10px] font-bold ${selected ? "text-[#176b55]" : "text-[#68766f]"}`}>{code}</span>}
    <FaceMap surfaces={entry?.surfaces ?? []} tone={tone} />
    {upper ? <span className={`mt-1 text-[10px] font-bold ${selected ? "text-[#176b55]" : "text-[#68766f]"}`}>{code}</span> : <ToothSilhouette code={code} upper={false} />}
    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${entry ? entry.status === "completed" || entry.entry_kind === "executed_procedure" ? "bg-emerald-500" : entry.entry_kind === "diagnosis" ? "bg-rose-500" : entry.entry_kind === "planned_procedure" ? "bg-sky-500" : "bg-amber-500" : "bg-transparent"}`} />
  </button>;
}

function Arch({ teeth, upper, latest, selected, onSelect }: { teeth: number[]; upper: boolean; latest: Map<number, Entry>; selected: number; onSelect: (code: number) => void }) {
  return <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${teeth.length}, minmax(0, 1fr))` }}>
    {teeth.map((code) => <Tooth key={code} code={code} upper={upper} entry={latest.get(code)} selected={selected === code} onSelect={() => onSelect(code)} />)}
  </div>;
}

export function OdontogramChart({ publicId, entries, canEdit }: { publicId: string; entries: Entry[]; canEdit: boolean }) {
  const firstPermanent = entries.find((entry) => entry.tooth_set === "permanent" && entry.tooth_code)?.tooth_code ?? 11;
  const [dentition, setDentition] = useState<ToothSet>("permanent");
  const [selected, setSelected] = useState(firstPermanent);
  const latest = useMemo(() => {
    const map = new Map<number, Entry>();
    for (const entry of entries) if (entry.tooth_set === dentition && entry.tooth_code && !map.has(entry.tooth_code)) map.set(entry.tooth_code, entry);
    return map;
  }, [dentition, entries]);
  const upper = dentition === "permanent" ? permanentUpper : deciduousUpper;
  const lower = dentition === "permanent" ? permanentLower : deciduousLower;
  const selectedEntries = entries.filter((entry) => entry.tooth_set === dentition && entry.tooth_code === selected).slice(0, 5);

  function switchDentition(next: ToothSet) {
    setDentition(next);
    const first = entries.find((entry) => entry.tooth_set === next && entry.tooth_code)?.tooth_code;
    setSelected(first ?? (next === "permanent" ? 11 : 51));
  }

  return <article id="odontograma" className="scroll-mt-4 overflow-hidden rounded-2xl border border-[#dce2df] bg-white">
    <header className="flex flex-wrap items-center gap-3 border-b border-[#e7ebe9] px-5 py-4 sm:px-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7f1ed] text-[#176b55]"><Stethoscope size={19} /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Odontograma</p><p className="mt-1 text-xs text-[#7a8581]">Selecione um dente para consultar ou registrar sua situação clínica.</p></div>
      <div className="flex rounded-xl bg-[#f1f4f2] p-1" role="tablist" aria-label="Tipo de dentição">
        <button type="button" role="tab" aria-selected={dentition === "permanent"} onClick={() => switchDentition("permanent")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${dentition === "permanent" ? "bg-white text-[#176b55] shadow-sm" : "text-[#71807b]"}`}>Permanentes</button>
        <button type="button" role="tab" aria-selected={dentition === "deciduous"} onClick={() => switchDentition("deciduous")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${dentition === "deciduous" ? "bg-white text-[#176b55] shadow-sm" : "text-[#71807b]"}`}>Decíduos</button>
      </div>
    </header>
    <div className="border-b border-[#edf0ee] bg-gradient-to-b from-white to-[#fafcfb] p-3 sm:p-5">
      <div className="overflow-x-auto pb-2">
        <div className={`mx-auto space-y-1 ${dentition === "permanent" ? "min-w-[900px]" : "min-w-[580px] max-w-[720px]"}`}>
          <Arch teeth={upper} upper latest={latest} selected={selected} onSelect={setSelected} />
          <div className="relative my-1 h-px bg-[#dce2df]"><span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-[#c9d2ce]" /></div>
          <Arch teeth={lower} upper={false} latest={latest} selected={selected} onSelect={setSelected} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-[#6f7b77]">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />Diagnóstico</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Condição</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" />Planejado</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Executado</span>
      </div>
    </div>
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[180px_1fr]">
      <div className="rounded-2xl bg-[#17201d] p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/45">Dente selecionado</p><p className="mt-1 text-4xl font-semibold tracking-[-.06em]">{selected}</p><p className="mt-2 text-xs text-white/55">{selectedEntries.length ? `${selectedEntries.length} registro(s) clínico(s)` : "Sem histórico clínico"}</p>{canEdit ? <Link href={`?panel=odontogram&tooth=${selected}&dentition=${dentition}#odontograma`} className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white text-xs font-bold text-[#176b55]"><Plus size={14} />Novo registro</Link> : null}</div>
      <div>{selectedEntries.length ? <div className="space-y-2">{selectedEntries.map((entry) => <div key={entry.id} className="flex gap-3 rounded-xl border border-[#e3e8e5] p-3"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4f7f5] ${toothTone(entry)}`}>{entry.entry_kind === "executed_procedure" ? <CheckCircle2 size={15} /> : entry.entry_kind === "planned_procedure" ? <Activity size={15} /> : <CircleDot size={15} />}</span><div className="min-w-0"><p className="text-xs font-semibold text-[#35423e]">{entry.description}</p><p className="mt-1 text-[10px] text-[#84908b]">{date.format(new Date(entry.occurred_at))} · {entry.entry_kind === "diagnosis" ? "Diagnóstico" : entry.entry_kind === "condition" ? "Condição" : entry.entry_kind === "planned_procedure" ? "Planejado" : "Executado"}</p></div></div>)}</div> : <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-[#d7dfdb] bg-[#fafbfa] text-center"><div><CircleDot size={18} className="mx-auto text-[#a5afab]" /><p className="mt-2 text-xs font-semibold text-[#61706b]">Dente {selected} sem registros</p><p className="mt-1 text-[11px] text-[#8a9490]">A situação clínica aparecerá aqui.</p></div></div>}</div>
    </div>
  </article>;
}
