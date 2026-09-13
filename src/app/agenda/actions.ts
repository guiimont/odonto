"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getClinicContext } from "@/lib/clinic-context";
import { localDateTimeToIso } from "@/lib/date-time";
import type { Database } from "@/types/database";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
const statuses = new Set<AppointmentStatus>(["scheduled", "confirmed", "waiting_room", "in_service", "completed", "no_show", "cancelled"]);

export async function createAppointment(formData: FormData) {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");

  const day = String(formData.get("day") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const patientPublicId = String(formData.get("patient_public_id") ?? "");
  const professionalProfileId = String(formData.get("professional_profile_id") ?? "");
  const observations = String(formData.get("observations") ?? "").trim() || null;
  const duration = Number(formData.get("duration_minutes"));
  const chairId = Number(formData.get("chair_id")) || null;

  if (!Number.isInteger(duration) || duration < 15 || duration > 480) redirect(`/agenda?date=${day}&error=invalid_duration`);

  const [{ data: patient }, { data: membership }] = await Promise.all([
    context.supabase.from("patients").select("id").eq("clinic_id", context.clinic.id).eq("public_id", patientPublicId).is("deleted_at", null).maybeSingle(),
    context.supabase.from("clinic_memberships").select("profile_id").eq("clinic_id", context.clinic.id).eq("profile_id", professionalProfileId).eq("status", "active").is("deleted_at", null).maybeSingle(),
  ]);
  if (!patient || !membership) redirect(`/agenda?date=${day}&error=invalid_reference`);

  let startsAt: string;
  try {
    startsAt = localDateTimeToIso(day, startTime, context.clinic.timezone);
  } catch {
    redirect(`/agenda?date=${day}&error=invalid_datetime`);
  }
  const endsAt = new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString();

  const { error } = await context.supabase.from("appointments").insert({
    clinic_id: context.clinic.id,
    patient_id: patient.id,
    professional_profile_id: professionalProfileId,
    chair_id: chairId,
    starts_at: startsAt,
    ends_at: endsAt,
    observations,
    status: "scheduled",
  });

  if (error) redirect(`/agenda?date=${day}&error=${error.code === "23P01" ? "schedule_conflict" : "save_failed"}`);
  revalidatePath("/agenda");
  redirect(`/agenda?date=${day}&created=1`);
}

export async function updateAppointmentStatus(formData: FormData) {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");
  const appointmentPublicId = String(formData.get("appointment_public_id") ?? "");
  const requestedStatus = String(formData.get("status") ?? "") as AppointmentStatus;
  const cancellationReason = String(formData.get("cancellation_reason") ?? "").trim() || null;
  if (!statuses.has(requestedStatus)) return;

  await context.supabase.from("appointments").update({
    status: requestedStatus,
    cancellation_reason: requestedStatus === "cancelled" ? cancellationReason : null,
  }).eq("clinic_id", context.clinic.id).eq("public_id", appointmentPublicId).is("deleted_at", null);
  revalidatePath("/agenda");
}
