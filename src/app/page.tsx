import { redirect } from "next/navigation";
import { DashboardWorkspace, type DashboardData } from "@/components/dashboard-workspace";
import { getClinicContext } from "@/lib/clinic-context";
import { addCalendarDays, clockInTimeZone, localDateTimeToIso, todayInTimeZone } from "@/lib/date-time";

function monthKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", timeZone }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

function monthSequence(today: string, count = 6) {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - count + index, 1));
    return { key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`, label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "") };
  });
}

export default async function Home() {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");

  const timeZone = context.clinic.timezone;
  const today = todayInTimeZone(timeZone);
  const months = monthSequence(today);
  const monthStart = `${today.slice(0, 7)}-01`;
  const [year, month] = monthStart.split("-").map(Number);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonth = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const chartStart = `${months[0].key}-01`;
  const todayStart = localDateTimeToIso(today, "00:00", timeZone);
  const tomorrowStart = localDateTimeToIso(addCalendarDays(today, 1), "00:00", timeZone);
  const monthStartIso = localDateTimeToIso(monthStart, "00:00", timeZone);
  const nextMonthIso = localDateTimeToIso(nextMonth, "00:00", timeZone);
  const chartStartIso = localDateTimeToIso(chartStart, "00:00", timeZone);

  const [patientsResult, profilesResult, monthAppointmentsResult, upcomingResult, transactionsResult, overdueResult, paidResult, settledResult, pendingBudgetsResult] = await Promise.all([
    context.supabase.from("patients").select("id, public_id, full_name, social_name").eq("clinic_id", context.clinic.id).is("deleted_at", null),
    context.supabase.from("profiles").select("id, full_name").is("deleted_at", null),
    context.supabase.from("appointments").select("status").eq("clinic_id", context.clinic.id).gte("starts_at", monthStartIso).lt("starts_at", nextMonthIso).is("deleted_at", null),
    context.supabase.from("appointments").select("public_id, patient_id, professional_profile_id, starts_at, status, observations").eq("clinic_id", context.clinic.id).gte("starts_at", todayStart).lt("starts_at", tomorrowStart).in("status", ["scheduled", "confirmed", "waiting_room", "in_service"]).is("deleted_at", null).order("starts_at").limit(6),
    context.supabase.from("financial_transactions").select("direction, status, gross_amount, occurred_at").eq("clinic_id", context.clinic.id).gte("occurred_at", chartStartIso).is("deleted_at", null),
    context.supabase.from("installments").select("amount, paid_amount, due_date, status").eq("clinic_id", context.clinic.id).lt("due_date", today).in("status", ["open", "partially_paid", "awaiting_settlement"]).is("deleted_at", null),
    context.supabase.from("payment_settlements").select("status, gross_amount, net_amount, paid_at").eq("clinic_id", context.clinic.id).gte("paid_at", chartStartIso).is("deleted_at", null),
    context.supabase.from("payment_settlements").select("status, net_amount, settled_at").eq("clinic_id", context.clinic.id).gte("settled_at", chartStartIso).is("deleted_at", null),
    context.supabase.from("budgets").select("total_amount").eq("clinic_id", context.clinic.id).in("status", ["pending", "partially_approved"]).is("deleted_at", null),
  ]);

  const patients = patientsResult.data ?? [];
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const profileById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const monthAppointments = (monthAppointmentsResult.data ?? []).filter((item) => item.status !== "cancelled");
  const transactions = (transactionsResult.data ?? []).filter((item) => !["cancelled", "reversed", "draft"].includes(item.status));
  const paidSettlements = (paidResult.data ?? []).filter((item) => !["cancelled", "reversed", "refunded", "failed"].includes(item.status));
  const settledPayments = (settledResult.data ?? []).filter((item) => item.status === "settled");
  const currentKey = today.slice(0, 7);
  const currentProduction = transactions.filter((item) => item.direction === "income" && monthKey(item.occurred_at, timeZone) === currentKey).reduce((sum, item) => sum + Number(item.gross_amount), 0);
  const currentPaid = paidSettlements.filter((item) => item.paid_at && monthKey(item.paid_at, timeZone) === currentKey).reduce((sum, item) => sum + Number(item.gross_amount), 0);
  const currentReceived = settledPayments.filter((item) => item.settled_at && monthKey(item.settled_at, timeZone) === currentKey).reduce((sum, item) => sum + Number(item.net_amount), 0);
  const overdueAmount = (overdueResult.data ?? []).reduce((sum, item) => sum + Math.max(0, Number(item.amount) - Number(item.paid_amount)), 0);
  const pendingBudgetAmount = (pendingBudgetsResult.data ?? []).reduce((sum, item) => sum + Number(item.total_amount), 0);
  const chart = months.map(({ key, label }) => ({ key, label, produced: transactions.filter((item) => item.direction === "income" && monthKey(item.occurred_at, timeZone) === key).reduce((sum, item) => sum + Number(item.gross_amount), 0), received: settledPayments.filter((item) => item.settled_at && monthKey(item.settled_at, timeZone) === key).reduce((sum, item) => sum + Number(item.net_amount), 0) }));
  const upcoming: DashboardData["upcoming"] = (upcomingResult.data ?? []).flatMap((appointment) => {
    const patient = patientById.get(appointment.patient_id);
    const professional = profileById.get(appointment.professional_profile_id);
    if (!patient || !professional) return [];
    return [{ publicId: appointment.public_id, patientPublicId: patient.public_id, time: clockInTimeZone(appointment.starts_at, timeZone), patient: patient.social_name || patient.full_name, professional: professional.full_name, description: appointment.observations || "Consulta odontológica", status: appointment.status }];
  });

  const data: DashboardData = {
    patientCount: patients.length,
    appointmentCount: monthAppointments.length,
    completedCount: monthAppointments.filter((item) => item.status === "completed").length,
    noShowCount: monthAppointments.filter((item) => item.status === "no_show").length,
    production: currentProduction,
    paid: currentPaid,
    received: currentReceived,
    overdueAmount,
    overdueCount: overdueResult.data?.length ?? 0,
    pendingBudgetAmount,
    pendingBudgetCount: pendingBudgetsResult.data?.length ?? 0,
    waitingCount: upcoming.filter((item) => item.status === "waiting_room").length,
    unconfirmedCount: upcoming.filter((item) => item.status === "scheduled").length,
    chart,
    upcoming,
    currentMonthLabel: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone }).format(new Date(monthStartIso)),
  };

  return <DashboardWorkspace clinicName={context.clinic.trade_name} userName={context.profile.full_name} data={data} />;
}
