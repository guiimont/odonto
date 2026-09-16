import { redirect } from "next/navigation";
import { CommissionLedgerWorkspace } from "@/components/commission-ledger-workspace";
import { getClinicContext } from "@/lib/clinic-context";

export default async function CommissionLedgerPage() {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");

  const commissionsResult = await context.supabase
    .from("commissions")
    .select(
      "public_id, professional_profile_id, status, trigger_event, calculation_type, calculation_basis, basis_amount, rule_value, commission_amount, accrued_at, approved_at, paid_at, reversed_at, reversal_reason, clinical_procedure_id, installment_id",
    )
    .eq("clinic_id", context.clinic.id)
    .is("deleted_at", null)
    .order("accrued_at", { ascending: false });

  const commissions = commissionsResult.data ?? [];
  const professionalIds = Array.from(
    new Set(commissions.map((item) => item.professional_profile_id)),
  );
  const procedureIds = commissions.flatMap((item) =>
    item.clinical_procedure_id ? [item.clinical_procedure_id] : [],
  );
  const installmentIds = commissions.flatMap((item) =>
    item.installment_id ? [item.installment_id] : [],
  );

  const [profilesResult, proceduresResult, installmentsResult] =
    await Promise.all([
      professionalIds.length
        ? context.supabase
            .from("profiles")
            .select("id, full_name, specialty")
            .in("id", professionalIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [], error: null }),
      procedureIds.length
        ? context.supabase
            .from("clinical_procedures")
            .select("id, treatment_name_snapshot")
            .eq("clinic_id", context.clinic.id)
            .in("id", procedureIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [], error: null }),
      installmentIds.length
        ? context.supabase
            .from("installments")
            .select("id, sequence_number, total_installments, is_entry")
            .eq("clinic_id", context.clinic.id)
            .in("id", installmentIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((item) => [item.id, item]),
  );
  const procedureMap = new Map(
    (proceduresResult.data ?? []).map((item) => [item.id, item]),
  );
  const installmentMap = new Map(
    (installmentsResult.data ?? []).map((item) => [item.id, item]),
  );
  const hasLoadError = Boolean(
    commissionsResult.error ||
      profilesResult.error ||
      proceduresResult.error ||
      installmentsResult.error,
  );

  return (
    <CommissionLedgerWorkspace
      clinicName={context.clinic.trade_name}
      userName={context.profile.full_name}
      canManage={["owner", "admin", "financial"].includes(context.role)}
      entries={commissions.map((commission) => {
        const profile = profileMap.get(commission.professional_profile_id);
        const procedure = commission.clinical_procedure_id
          ? procedureMap.get(commission.clinical_procedure_id)
          : null;
        const installment = commission.installment_id
          ? installmentMap.get(commission.installment_id)
          : null;

        return {
          publicId: commission.public_id,
          professionalProfileId: commission.professional_profile_id,
          professionalName: profile?.full_name ?? "Profissional não encontrado",
          professionalSpecialty: profile?.specialty ?? null,
          status: commission.status,
          triggerEvent: commission.trigger_event,
          calculationType: commission.calculation_type,
          calculationBasis: commission.calculation_basis,
          basisAmount: Number(commission.basis_amount),
          ruleValue: Number(commission.rule_value),
          commissionAmount: Number(commission.commission_amount),
          accruedAt: commission.accrued_at,
          approvedAt: commission.approved_at,
          paidAt: commission.paid_at,
          reversedAt: commission.reversed_at,
          reversalReason: commission.reversal_reason,
          originLabel:
            procedure?.treatment_name_snapshot ??
            (installment
              ? installment.is_entry
                ? "Entrada recebida"
                : `Parcela ${installment.sequence_number}/${installment.total_installments}`
              : commission.trigger_event === "installment_paid"
                ? "Parcela recebida"
                : "Procedimento concluído"),
        };
      })}
      loadError={
        hasLoadError
          ? "Não foi possível carregar todo o extrato de comissões."
          : null
      }
    />
  );
}
