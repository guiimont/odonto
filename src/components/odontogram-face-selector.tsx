"use client";

import { useState, type KeyboardEvent } from "react";

type Surface = "mesial" | "occlusal_incisal" | "distal" | "vestibular" | "lingual_palatal" | "cervical" | "all";

const options: Array<{ value: Exclude<Surface, "all">; label: string; short: string }> = [
  { value: "vestibular", label: "Vestibular", short: "V" },
  { value: "mesial", label: "Mesial", short: "M" },
  { value: "occlusal_incisal", label: "Oclusal / incisal", short: "O/I" },
  { value: "distal", label: "Distal", short: "D" },
  { value: "lingual_palatal", label: "Lingual / palatina", short: "L/P" },
  { value: "cervical", label: "Cervical", short: "C" },
];

const paths: Record<Exclude<Surface, "cervical" | "all">, string> = {
  mesial: "M8 12 L27 28 L27 52 L8 68 Q-1 40 8 12Z",
  distal: "M72 12 L53 28 L53 52 L72 68 Q81 40 72 12Z",
  vestibular: "M12 8 L28 27 L52 27 L68 8 Q40 -1 12 8Z",
  lingual_palatal: "M12 72 L28 53 L52 53 L68 72 Q40 81 12 72Z",
  occlusal_incisal: "M27 27 H53 V53 H27Z",
};

export function OdontogramFaceSelector() {
  const [selected, setSelected] = useState<Surface[]>([]);

  function toggle(surface: Surface) {
    setSelected((current) => {
      if (surface === "all") return current.includes("all") ? [] : ["all"];
      const withoutAll = current.filter((item) => item !== "all");
      return withoutAll.includes(surface) ? withoutAll.filter((item) => item !== surface) : [...withoutAll, surface];
    });
  }

  function handleKey(event: KeyboardEvent<SVGPathElement>, surface: Surface) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(surface);
    }
  }

  const active = (surface: Surface) => selected.includes("all") || selected.includes(surface);
  const selectionText = selected.includes("all")
    ? "Dente inteiro"
    : selected.length
      ? options.filter((option) => selected.includes(option.value)).map((option) => option.label).join(", ")
      : "Nenhuma face específica";

  return <fieldset className="sm:col-span-2">
    <legend className="text-xs font-semibold text-[#52605b]">Faces envolvidas</legend>
    <p className="mt-1 text-[11px] leading-5 text-[#85908c]">Marque somente as faces relacionadas ao achado ou procedimento. É possível selecionar mais de uma.</p>
    <div className="mt-3 grid gap-4 rounded-2xl border border-[#dce2df] bg-[#f8faf9] p-4 sm:grid-cols-[170px_1fr] sm:p-5">
      <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#e1e7e4]">
        <svg viewBox="0 0 80 80" className="h-36 w-36 text-[#176b55]" aria-label="Mapa interativo das faces do dente">
          <rect x="2" y="2" width="76" height="76" rx="26" fill="#f8faf9" stroke="#cbd6d1" strokeWidth="2" />
          {(Object.entries(paths) as Array<[Exclude<Surface, "cervical" | "all">, string]>).map(([surface, path]) => <path
            key={surface}
            d={path}
            role="checkbox"
            tabIndex={0}
            aria-checked={active(surface)}
            aria-label={options.find((option) => option.value === surface)?.label}
            onClick={() => toggle(surface)}
            onKeyDown={(event) => handleKey(event, surface)}
            fill={active(surface) ? "#176b55" : "#ffffff"}
            stroke={active(surface) ? "#0f5946" : "#b9c6c0"}
            strokeWidth="1.8"
            className="cursor-pointer outline-none transition-colors focus-visible:stroke-[#91b700] focus-visible:stroke-[4]"
          />)}
          <circle cx="40" cy="40" r="33" fill="none" stroke={active("cervical") ? "#91b700" : "#d4ddd9"} strokeWidth={active("cervical") ? 4 : 1.5} pointerEvents="none" />
          <text x="40" y="44" textAnchor="middle" fontSize="9" fontWeight="700" fill={active("occlusal_incisal") ? "#ffffff" : "#69766f"} pointerEvents="none">O/I</text>
        </svg>
        <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[.12em] text-[#75817c]">Mapa de superfícies</p>
      </div>
      <div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((option) => <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={active(option.value)}
            className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b55]/35 ${active(option.value) ? "border-[#176b55] bg-[#e7f1ed] text-[#125c49]" : "border-[#dce2df] bg-white text-[#5f6d68] hover:border-[#afbeb7]"}`}
          >
            <span className={`grid h-6 min-w-6 place-items-center rounded-lg text-[9px] font-black ${active(option.value) ? "bg-[#176b55] text-white" : "bg-[#eef2f0] text-[#77837e]"}`}>{option.short}</span>
            {option.label}
          </button>)}
        </div>
        <button type="button" onClick={() => toggle("all")} aria-pressed={selected.includes("all")} className={`mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b55]/35 ${selected.includes("all") ? "border-[#91b700] bg-[#eff8d5] text-[#456300]" : "border-dashed border-[#cdd7d2] bg-white text-[#61706a] hover:border-[#aebcb5]"}`}>Selecionar dente inteiro</button>
        <div aria-live="polite" className="mt-3 rounded-xl bg-[#17201d] px-3 py-2.5 text-[11px] text-white/75"><span className="font-bold text-white">Seleção:</span> {selectionText}</div>
      </div>
    </div>
    {selected.map((surface) => <input key={surface} type="hidden" name="surfaces" value={surface} />)}
  </fieldset>;
}
