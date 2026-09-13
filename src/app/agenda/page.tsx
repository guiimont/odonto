import { redirect } from "next/navigation";
import { AgendaWorkspace } from "@/components/agenda-workspace";
import { getClinicContext } from "@/lib/clinic-context";
import { addCalendarDays, clockInTimeZone, localDateTimeToIso, normalizeCalendarDate, todayInTimeZone } from "@/lib/date-time";

const appointmentErrors: Record<string, string> = {
  invalid_duration: "Escolha uma duração entre 15 minutos e 8 horas.",
  invalid_reference: "O paciente ou profissional selecionado não está mais disponível.",
  invalid_datetime: "Revise a data e o horário do atendimento.",
  schedule_conflict: "Este profissional ou consultório já possui um atendimento nesse horário.",
  save_failed: "Não foi possível salvar o agendamento. Tente novamente.",
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ date?: string; error?: string; created?: string; patient?: string; new?: string }> }) {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");
  const params = await searchParams;
  const today = todayInTimeZone(context.clinic.timezone);
  const selectedDate = normalizeCalendarDate(params.date, today);
  const startsAt = localDateTimeToIso(selectedDate, "00:00", context.clinic.timezone);
  const endsAt = localDateTimeToIso(addCalendarDays(selectedDate, 1), "00:00", context.clinic.timezone);

  const [appointmentsResult, patientsResult, membershipsResult, profilesResult, chairsResult, alertsResult] = await Promise.all([
    context.supabase.from("appointments").select("public_id, patient_id, professional_profile_id, chair_id, starts_at, ends_at, duration_minutes, status, observations").eq("clinic_id", context.clinic.id).gte("starts_at", startsAt).lt("starts_at", endsAt).is("deleted_at", null).order("starts_at"),
    context.supabase.from("patients").select("id, public_id, full_name, social_name, phone_e164, whatsapp_e164").eq("clinic_id", context.clinic.id).is("deleted_at", null).order("full_name").limit(500),
    context.supabase.from("clinic_memberships").select("profile_id, role").eq("clinic_id", context.clinic.id).eq("status", "active").is("deleted_at", null),
    context.supabase.from("profiles").select("id, full_name, specialty").is("deleted_at", null),
    context.supabase.from("chairs").select("id, name").eq("clinic_id", context.clinic.id).eq("active", true).is("deleted_at", null).order("name"),
    context.supabase.from("patient_medical_alerts").select("patient_id, description").eq("clinic_id", context.clinic.id).eq("active", true).is("deleted_at", null),
  ]);

  const patients = patientsResult.data ?? [];
  const initialPatientPublicId = patients.some((patient) => patient.public_id === params.patient) ? params.patient : undefined;
  const profiles = profilesResult.data ?? [];
  const memberships = membershipsResult.data ?? [];
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const alertsByPatient = new Map<number, string[]>();
  (alertsResult.data ?? []).forEach((alert) => alertsByPatient.set(alert.patient_id, [...(alertsByPatient.get(alert.patient_id) ?? []), alert.description]));

  const professionals = memberships.filter((membership) => ["owner", "admin", "dentist"].includes(membership.role)).flatMap((membership) => {
    const profile = profileById.get(membership.profile_id);
    return profile ? [{ id: profile.id, name: profile.full_name, specialty: profile.specialty || (membership.role === "dentist" ? "Cirurgião-dentista" : "Responsável clínico") }] : [];
  });

  const appointments = (appointmentsResult.data ?? []).flatMap((appointment) => {
    const patient = patientById.get(appointment.patient_id);
    const professional = profileById.get(appointment.professional_profile_id);
    if (!patient || !professional) return [];
    return [{ publicId: appointment.public_id, patientPublicId: patient.public_id, patientName: patient.social_name || patient.full_name, patientPhone: patient.whatsapp_e164 || patient.phone_e164, professionalId: professional.id, professionalName: professional.full_name, chairId: appointment.chair_id, startsAt: appointment.starts_at, endsAt: appointment.ends_at, startTime: clockInTimeZone(appointment.starts_at, context.clinic.timezone), endTime: clockInTimeZone(appointment.ends_at, context.clinic.timezone), durationMinutes: appointment.duration_minutes ?? Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60_000), status: appointment.status, observations: appointment.observations, alerts: alertsByPatient.get(patient.id) ?? [] }];
  });

  return <AgendaWorkspace clinicName={context.clinic.trade_name} userName={context.profile.full_name} selectedDate={selectedDate} today={today} appointments={appointments} professionals={professionals} patients={patients.map((patient) => ({ publicId: patient.public_id, name: patient.social_name || patient.full_name }))} chairs={chairsResult.data ?? []} initialPatientPublicId={initialPatientPublicId} openNew={params.new === "1" && patients.length > 0} message={params.error ? appointmentErrors[params.error] : params.created ? "Agendamento criado com sucesso." : null} messageTone={params.error ? "error" : "success"} />;
}
