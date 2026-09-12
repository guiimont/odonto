import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/onboarding-card";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membership } = await supabase.from("clinic_memberships").select("id").eq("profile_id", userId).eq("status", "active").is("deleted_at", null).maybeSingle();
  if (membership) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  return <main className="grid min-h-screen place-items-center bg-[#f3f5f4] px-5 py-10"><OnboardingCard userName={profile?.full_name ?? "Guilherme"} /></main>;
}
