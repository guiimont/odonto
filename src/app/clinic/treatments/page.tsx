import { redirect } from "next/navigation";
import { TreatmentCatalogWorkspace } from "@/components/treatment-catalog-workspace";
import { getClinicContext } from "@/lib/clinic-context";

export default async function TreatmentsCatalogPage() {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");

  const { data, error } = await context.supabase
    .from("treatments_catalog")
    .select("public_id, code, name, category, description, base_price, cost_amount, estimated_minutes, segmented_by_tooth, active")
    .eq("clinic_id", context.clinic.id)
    .is("deleted_at", null)
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  return (
    <TreatmentCatalogWorkspace
      clinicName={context.clinic.trade_name}
      userName={context.profile.full_name}
      canManage={context.role === "owner" || context.role === "admin"}
      treatments={(data ?? []).map((item) => ({
        publicId: item.public_id,
        code: item.code,
        name: item.name,
        category: item.category,
        description: item.description,
        basePrice: Number(item.base_price),
        costAmount: Number(item.cost_amount),
        estimatedMinutes: item.estimated_minutes,
        segmentedByTooth: item.segmented_by_tooth,
        active: item.active,
      }))}
      loadError={error ? "Não foi possível carregar o catálogo agora." : null}
    />
  );
}
