import { AgendaWorkspace } from "@/components/agenda-workspace";
import { redirect } from "next/navigation";
import { getClinicContext } from "@/lib/clinic-context";

export default async function AgendaPage() {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");
  return <AgendaWorkspace clinicName={context.clinic.trade_name} userName={context.profile.full_name} />;
}
