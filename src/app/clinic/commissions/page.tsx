import { redirect } from "next/navigation";
import { CommissionRulesWorkspace } from "@/components/commission-rules-workspace";
import { getClinicContext } from "@/lib/clinic-context";

export default async function CommissionRulesPage() {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");

  const [membershipsResult, treatmentsResult, plansResult, rulesResult] = await Promise.all([
    context.supabase.from("clinic_memberships").select("profile_id, role").eq("clinic_id", context.clinic.id).eq("status", "active").is("deleted_at", null),
    context.supabase.from("treatments_catalog").select("id, public_id, name, category, active").eq("clinic_id", context.clinic.id).is("deleted_at", null).order("name"),
    context.supabase.from("dental_plans").select("id, public_id, name, active").eq("clinic_id", context.clinic.id).is("deleted_at", null).order("name"),
    context.supabase.from("commission_rules").select("public_id, professional_profile_id, trigger_event, calculation_type, calculation_basis, value, treatment_catalog_id, treatment_category, dental_plan_id, effective_from, effective_until, active").eq("clinic_id", context.clinic.id).is("deleted_at", null).order("active", { ascending: false }).order("created_at", { ascending: false }),
  ]);

  const membershipIds = (membershipsResult.data ?? []).map((item) => item.profile_id);
  const { data: profiles } = membershipIds.length
    ? await context.supabase.from("profiles").select("id, full_name, specialty").in("id", membershipIds).is("deleted_at", null).order("full_name")
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((item) => [item.id, item]));
  const roleMap = new Map((membershipsResult.data ?? []).map((item) => [item.profile_id, item.role]));
  const treatments = treatmentsResult.data ?? [];
  const plans = plansResult.data ?? [];
  const treatmentMap = new Map(treatments.map((item) => [item.id, item]));
  const planMap = new Map(plans.map((item) => [item.id, item]));
  const hasLoadError = [membershipsResult, treatmentsResult, plansResult, rulesResult].some((result) => result.error);

  return <CommissionRulesWorkspace
    clinicName={context.clinic.trade_name}
    userName={context.profile.full_name}
    canManage={context.role === "owner" || context.role === "admin"}
    professionals={(profiles ?? []).map((profile) => ({ profileId: profile.id, name: profile.full_name, specialty: profile.specialty, role: roleMap.get(profile.id) ?? "dentist" }))}
    treatments={treatments.map((item) => ({ publicId: item.public_id, name: item.name, category: item.category, active: item.active }))}
    plans={plans.map((item) => ({ publicId: item.public_id, name: item.name, active: item.active }))}
    rules={(rulesResult.data ?? []).map((rule) => ({
      publicId: rule.public_id,
      professionalProfileId: rule.professional_profile_id,
      professionalName: profileMap.get(rule.professional_profile_id)?.full_name ?? "Profissional não encontrado",
      triggerEvent: rule.trigger_event,
      calculationType: rule.calculation_type,
      calculationBasis: rule.calculation_basis,
      value: Number(rule.value),
      treatmentPublicId: rule.treatment_catalog_id ? treatmentMap.get(rule.treatment_catalog_id)?.public_id ?? null : null,
      treatmentName: rule.treatment_catalog_id ? treatmentMap.get(rule.treatment_catalog_id)?.name ?? null : null,
      treatmentCategory: rule.treatment_category,
      dentalPlanPublicId: rule.dental_plan_id ? planMap.get(rule.dental_plan_id)?.public_id ?? null : null,
      dentalPlanName: rule.dental_plan_id ? planMap.get(rule.dental_plan_id)?.name ?? null : null,
      effectiveFrom: rule.effective_from,
      effectiveUntil: rule.effective_until,
      active: rule.active,
    }))}
    loadError={hasLoadError ? "Não foi possível carregar todos os dados de comissão." : null}
  />;
}
