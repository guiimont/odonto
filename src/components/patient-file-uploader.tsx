"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerPatientFile } from "@/app/patients/[publicId]/actions";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf", "application/dicom"]);

function safeExtension(name: string) {
  return name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "bin";
}

export function PatientFileUploader({ patientPublicId, clinicId }: { patientPublicId: string; clinicId: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) return setMessage({ tone: "error", text: "Selecione um arquivo." });
    if (!allowedTypes.has(file.type) || file.size > 15 * 1024 * 1024) return setMessage({ tone: "error", text: "Use imagem, PDF ou DICOM de até 15 MB." });

    setPending(true);
    setMessage(null);
    const storagePath = `${clinicId}/${patientPublicId}/${crypto.randomUUID()}.${safeExtension(file.name)}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("clinical-files").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setPending(false);
      return setMessage({ tone: "error", text: "Não foi possível enviar o arquivo." });
    }

    const result = await registerPatientFile(patientPublicId, {
      storagePath,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      category: String(data.get("category") ?? "document"),
      description: String(data.get("description") ?? ""),
    });
    setPending(false);
    setMessage({ tone: result.ok ? "success" : "error", text: result.message });
    if (result.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }

  return <form ref={formRef} onSubmit={upload} className="mt-4 grid gap-3 rounded-2xl border border-dashed border-[#cbd5d1] bg-[#fafbfa] p-4 sm:grid-cols-2">
    <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Arquivo clínico</span><input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,application/dicom,.dcm" className="block w-full rounded-xl border border-[#dce2df] bg-white p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#e7f1ed] file:px-3 file:py-2 file:font-semibold file:text-[#176b55]" /></label>
    <label><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Categoria</span><select name="category" defaultValue="document" className="auth-input"><option value="intraoral_photo">Foto intraoral</option><option value="radiograph">Radiografia</option><option value="exam">Exame</option><option value="document">Documento</option><option value="other">Outro</option></select></label>
    <label><span className="mb-1.5 block text-xs font-semibold text-[#52605b]">Descrição</span><input name="description" maxLength={1000} placeholder="Ex.: Panorâmica inicial" className="auth-input" /></label>
    {message ? <p aria-live="polite" className={`text-xs sm:col-span-2 ${message.tone === "success" ? "text-emerald-700" : "text-rose-700"}`}>{message.text}</p> : null}
    <button disabled={pending} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#17201d] px-4 text-xs font-semibold text-white disabled:opacity-60 sm:col-span-2">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <FileUp size={16} />}{pending ? "Enviando com segurança..." : "Anexar ao prontuário"}</button>
  </form>;
}
