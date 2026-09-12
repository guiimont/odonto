import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { redirect } from "next/navigation";
import { getClinicContext } from "@/lib/clinic-context";

export default async function Home() {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");
  return <DashboardWorkspace clinicName={context.clinic.trade_name} userName={context.profile.full_name} />;
}
