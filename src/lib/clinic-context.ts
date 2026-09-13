import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getClinicContext() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/login");

  const { data: membership } = await supabase
    .from("clinic_memberships")
    .select("clinic_id, role")
    .eq("profile_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (!membership) return null;

  const [{ data: clinic }, { data: profile }] = await Promise.all([
    supabase.from("clinics").select("id, public_id, trade_name, timezone").eq("id", membership.clinic_id).single(),
    supabase.from("profiles").select("id, full_name, email").eq("id", userId).single(),
  ]);

  if (!clinic || !profile) return null;

  return { supabase, clinic, profile, role: membership.role };
}
