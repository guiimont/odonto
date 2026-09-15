"use server";

import { revalidatePath } from "next/cache";
import { getClinicContext } from "@/lib/clinic-context";

export type TreatmentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number;
};

export const initialTreatmentActionState: TreatmentActionState = {
  status: "idle",
  message: "",
  submittedAt: 0,
};

const adminRoles = new Set(["owner", "admin"]);

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readMoney(formData: FormData, key: string) {
  const raw = readText(formData, key).replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
}

function failure(message: string): TreatmentActionState {
  return { status: "error", message, submittedAt: Date.now() };
}

async function getAdminContext() {
  const context = await getClinicContext();
  if (!context || !adminRoles.has(context.role)) return null;
  return context;
}

export async function saveTreatment(
  _previousState: TreatmentActionState,
  formData: FormData,
): Promise<TreatmentActionState> {
  const context = await getAdminContext();
  if (!context) return failure("Apenas proprietários e administradores podem alterar o catálogo.");

  const publicId = readText(formData, "publicId");
  const name = readText(formData, "name");
  const code = readText(formData, "code");
  const category = readText(formData, "category");
  const description = readText(formData, "description");
  const basePrice = readMoney(formData, "basePrice");
  const costAmount = readMoney(formData, "costAmount");
  const estimatedRaw = readText(formData, "estimatedMinutes");
  const estimatedMinutes = estimatedRaw === "" ? null : Number(estimatedRaw);
  const segmentedByTooth = formData.get("segmentedByTooth") === "on";

  if (name.length < 2 || name.length > 140) return failure("Informe um nome entre 2 e 140 caracteres.");
  if (code.length > 50) return failure("O código deve ter no máximo 50 caracteres.");
  if (category.length > 80) return failure("A categoria deve ter no máximo 80 caracteres.");
  if (description.length > 1000) return failure("A descrição deve ter no máximo 1.000 caracteres.");
  if (basePrice === null || costAmount === null) return failure("Preço e custo precisam ser valores positivos ou zero.");
  if (estimatedMinutes !== null && (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 1440)) {
    return failure("A duração deve ser informada em minutos, entre 1 e 1.440.");
  }

  const payload = {
    name,
    code: code || null,
    category: category || null,
    description: description || null,
    base_price: basePrice,
    cost_amount: costAmount,
    estimated_minutes: estimatedMinutes,
    segmented_by_tooth: segmentedByTooth,
  };

  if (publicId) {
    const { data: existing, error: lookupError } = await context.supabase
      .from("treatments_catalog")
      .select("id")
      .eq("clinic_id", context.clinic.id)
      .eq("public_id", publicId)
      .is("deleted_at", null)
      .maybeSingle();

    if (lookupError || !existing) return failure("Tratamento não encontrado nesta clínica.");

    const { error } = await context.supabase
      .from("treatments_catalog")
      .update(payload)
      .eq("id", existing.id)
      .eq("clinic_id", context.clinic.id);

    if (error) return failure("Não foi possível atualizar o tratamento. Tente novamente.");
  } else {
    const { error } = await context.supabase.from("treatments_catalog").insert({
      ...payload,
      clinic_id: context.clinic.id,
    });

    if (error) return failure("Não foi possível cadastrar o tratamento. Tente novamente.");
  }

  revalidatePath("/clinic/treatments");
  return {
    status: "success",
    message: publicId ? "Tratamento atualizado com sucesso." : "Tratamento adicionado ao catálogo.",
    submittedAt: Date.now(),
  };
}

export async function setTreatmentActive(publicId: string, nextActive: boolean) {
  const context = await getAdminContext();
  if (!context) return;

  const { data: existing } = await context.supabase
    .from("treatments_catalog")
    .select("id")
    .eq("clinic_id", context.clinic.id)
    .eq("public_id", publicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return;

  await context.supabase
    .from("treatments_catalog")
    .update({ active: nextActive })
    .eq("id", existing.id)
    .eq("clinic_id", context.clinic.id);

  revalidatePath("/clinic/treatments");
}
