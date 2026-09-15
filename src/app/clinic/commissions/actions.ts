"use server";

import { revalidatePath } from "next/cache";
import { getClinicContext } from "@/lib/clinic-context";

export type CommissionRuleActionState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number;
};

export const initialCommissionRuleActionState: CommissionRuleActionState = {
  status: "idle",
  message: "",
  submittedAt: 0,
};

const adminRoles = new Set(["owner", "admin"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function failure(message: string): CommissionRuleActionState {
  return { status: "error", message, submittedAt: Date.now() };
}

async function getAdminContext() {
  const context = await getClinicContext();
  if (!context || !adminRoles.has(context.role)) return null;
  return context;
}

export async function saveCommissionRule(
  _previousState: CommissionRuleActionState,
  formData: FormData,
): Promise<CommissionRuleActionState> {
  const context = await getAdminContext();
  if (!context) return failure("Apenas proprietários e administradores podem alterar regras de comissão.");

  const publicId = readText(formData, "publicId");
  const professionalProfileId = readText(formData, "professionalProfileId");
  const triggerEvent = readText(formData, "triggerEvent");
  const calculationType = readText(formData, "calculationType");
  const calculationBasis = readText(formData, "calculationBasis");
  const scope = readText(formData, "scope");
  const value = Number(readText(formData, "value").replace(",", "."));
  const effectiveFrom = readText(formData, "effectiveFrom");
  const effectiveUntil = readText(formData, "effectiveUntil");

  if (!uuidPattern.test(professionalProfileId)) return failure("Selecione um profissional válido.");
  if (triggerEvent !== "treatment_completed") return failure("O evento selecionado ainda não está disponível.");
  if (!['percentage', 'fixed_amount'].includes(calculationType)) return failure("Selecione uma forma de cálculo válida.");
  if (!['procedure_gross', 'procedure_net_after_discount'].includes(calculationBasis)) return failure("Selecione uma base de cálculo válida.");
  if (!['general', 'treatment', 'category', 'plan'].includes(scope)) return failure("Selecione um escopo válido.");
  if (!Number.isFinite(value) || value <= 0 || (calculationType === "percentage" && value > 100)) return failure("Informe um percentual entre 0,01% e 100% ou um valor fixo maior que zero.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) || (effectiveUntil && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveUntil))) return failure("Informe uma vigência válida.");
  if (effectiveUntil && effectiveUntil < effectiveFrom) return failure("A data final não pode ser anterior à data inicial.");
  if (calculationType === "fixed_amount" && scope !== "treatment") return failure("Comissão em valor fixo precisa ser vinculada a um tratamento específico.");

  const { data: membership } = await context.supabase
    .from("clinic_memberships")
    .select("profile_id")
    .eq("clinic_id", context.clinic.id)
    .eq("profile_id", professionalProfileId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!membership) return failure("O profissional não possui vínculo ativo com esta clínica.");

  let treatmentCatalogId: number | null = null;
  let treatmentCategory: string | null = null;
  let dentalPlanId: number | null = null;

  if (scope === "treatment") {
    const treatmentPublicId = readText(formData, "treatmentPublicId");
    if (!uuidPattern.test(treatmentPublicId)) return failure("Selecione um tratamento específico.");
    const { data: treatment } = await context.supabase.from("treatments_catalog").select("id").eq("clinic_id", context.clinic.id).eq("public_id", treatmentPublicId).is("deleted_at", null).maybeSingle();
    if (!treatment) return failure("Tratamento não encontrado nesta clínica.");
    treatmentCatalogId = treatment.id;
  }

  if (scope === "category") {
    treatmentCategory = readText(formData, "treatmentCategory");
    if (treatmentCategory.length < 2 || treatmentCategory.length > 80) return failure("Informe uma categoria válida.");
  }

  if (scope === "plan") {
    const dentalPlanPublicId = readText(formData, "dentalPlanPublicId");
    if (!uuidPattern.test(dentalPlanPublicId)) return failure("Selecione um convênio ou plano.");
    const { data: plan } = await context.supabase.from("dental_plans").select("id").eq("clinic_id", context.clinic.id).eq("public_id", dentalPlanPublicId).is("deleted_at", null).maybeSingle();
    if (!plan) return failure("Convênio ou plano não encontrado nesta clínica.");
    dentalPlanId = plan.id;
  }

  const payload = {
    professional_profile_id: professionalProfileId,
    trigger_event: "treatment_completed" as const,
    calculation_type: calculationType as "percentage" | "fixed_amount",
    calculation_basis: calculationBasis as "procedure_gross" | "procedure_net_after_discount",
    value: Math.round(value * 10000) / 10000,
    treatment_catalog_id: treatmentCatalogId,
    treatment_category: treatmentCategory,
    dental_plan_id: dentalPlanId,
    effective_from: `${effectiveFrom}T00:00:00.000Z`,
    effective_until: effectiveUntil ? `${effectiveUntil}T23:59:59.999Z` : null,
  };

  if (publicId) {
    if (!uuidPattern.test(publicId)) return failure("Regra inválida.");
    const { data: existing } = await context.supabase.from("commission_rules").select("id").eq("clinic_id", context.clinic.id).eq("public_id", publicId).is("deleted_at", null).maybeSingle();
    if (!existing) return failure("Regra não encontrada nesta clínica.");
    const { error } = await context.supabase.from("commission_rules").update(payload).eq("clinic_id", context.clinic.id).eq("id", existing.id);
    if (error) return failure("Não foi possível atualizar a regra. Revise os dados e tente novamente.");
  } else {
    const { error } = await context.supabase.from("commission_rules").insert({ ...payload, clinic_id: context.clinic.id });
    if (error) return failure("Não foi possível criar a regra. Revise os dados e tente novamente.");
  }

  revalidatePath("/clinic/commissions");
  return { status: "success", message: publicId ? "Regra atualizada com sucesso." : "Regra de comissão criada.", submittedAt: Date.now() };
}

export async function setCommissionRuleActive(publicId: string, nextActive: boolean) {
  const context = await getAdminContext();
  if (!context || !uuidPattern.test(publicId)) return;
  const { data: existing } = await context.supabase.from("commission_rules").select("id").eq("clinic_id", context.clinic.id).eq("public_id", publicId).is("deleted_at", null).maybeSingle();
  if (!existing) return;
  await context.supabase.from("commission_rules").update({ active: nextActive }).eq("clinic_id", context.clinic.id).eq("id", existing.id);
  revalidatePath("/clinic/commissions");
}
