"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getClinicContext } from "@/lib/clinic-context";

function optional(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim() || null;
}

function digits(value: string | null) {
  return value?.replace(/\D/g, "") || null;
}

function brazilPhone(value: string | null) {
  const clean = digits(value);
  if (!clean) return null;
  return clean.startsWith("55") ? `+${clean}` : `+55${clean}`;
}

export async function createPatient(formData: FormData) {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const cpf = digits(optional(formData, "cpf"));
  const phone = brazilPhone(optional(formData, "phone"));
  const whatsapp = brazilPhone(optional(formData, "whatsapp"));

  if (fullName.length < 2) redirect("/patients/new?error=invalid_name");
  if (cpf && cpf.length !== 11) redirect("/patients/new?error=invalid_cpf");
  if (phone && (phone.length < 11 || phone.length > 16)) redirect("/patients/new?error=invalid_phone");

  const { data, error } = await context.supabase.from("patients").insert({
    clinic_id: context.clinic.id,
    full_name: fullName,
    social_name: optional(formData, "social_name"),
    birth_date: optional(formData, "birth_date"),
    cpf_digits: cpf,
    phone_e164: phone,
    whatsapp_e164: whatsapp,
    email: optional(formData, "email"),
    reminder_preference: "whatsapp",
    notes: optional(formData, "notes"),
  }).select("public_id").single();

  if (error || !data) redirect(`/patients/new?error=${error?.code === "23505" ? "duplicate_cpf" : "save_failed"}`);
  revalidatePath("/patients");
  redirect(`/patients/${data.public_id}`);
}
