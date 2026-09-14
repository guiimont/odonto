"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getClinicContext } from "@/lib/clinic-context";
import { localDateTimeToIso } from "@/lib/date-time";
import type { Database, Json } from "@/types/database";

type ToothSet = Database["public"]["Enums"]["tooth_set"];
type EntryKind = Database["public"]["Enums"]["odontogram_entry_kind"];
type Surface = Database["public"]["Enums"]["odontogram_surface"];
type Selection = Database["public"]["Enums"]["anamnesis_answer_selection"];
type DiscountType = Database["public"]["Enums"]["discount_type"];

const clinicalRoles = new Set(["owner", "admin", "dentist", "assistant"]);
const patientEditorRoles = new Set(["owner", "admin", "dentist", "assistant", "secretary"]);
const alertTypes = new Set(["allergy", "medication", "condition", "bleeding", "cardiac", "other"]);
const alertSeverities = new Set(["info", "warning", "critical"]);
const entryKinds = new Set<EntryKind>(["diagnosis", "condition", "planned_procedure", "executed_procedure"]);
const toothSets = new Set<ToothSet>(["permanent", "deciduous"]);
const surfaces = new Set<Surface>(["mesial", "occlusal_incisal", "distal", "vestibular", "lingual_palatal", "cervical", "all"]);
const selections = new Set<Selection>(["yes", "no", "unknown"]);
const fileCategories = new Set(["intraoral_photo", "radiograph", "exam", "document", "other"]);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf", "application/dicom"]);
const budgetRoles = new Set(["owner", "admin", "dentist", "assistant", "secretary"]);
const approvalRoles = new Set(["owner", "admin", "dentist", "secretary", "financial"]);
const financeRoles = new Set(["owner", "admin", "secretary", "financial"]);
const discountTypes = new Set<DiscountType>(["fixed_amount", "percentage"]);

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function optional(formData: FormData, key: string, max = 5000) {
  return text(formData, key, max) || null;
}

function digits(value: string | null) {
  return value?.replace(/\D/g, "") || null;
}

function brazilPhone(value: string | null) {
  const clean = digits(value);
  if (!clean) return null;
  return clean.startsWith("55") ? `+${clean}` : `+55${clean}`;
}

function validCpf(value: string | null) {
  if (!value) return true;
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  const calculate = (length: number) => {
    const sum = value.slice(0, length).split("").reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculate(9) === Number(value[9]) && calculate(10) === Number(value[10]);
}

function patientPath(publicId: string, params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  return `/patients/${encodeURIComponent(publicId)}${query}`;
}

function refreshPatient(publicId: string) {
  revalidatePath(patientPath(publicId));
  revalidatePath("/patients");
  revalidatePath("/");
}

async function getOwnedPatient(publicId: string) {
  const context = await getClinicContext();
  if (!context) redirect("/onboarding");
  const { data: patient } = await context.supabase
    .from("patients")
    .select("id, public_id")
    .eq("clinic_id", context.clinic.id)
    .eq("public_id", publicId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!patient) redirect("/patients");
  return { context, patient };
}

export async function updatePatient(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!patientEditorRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));

  const fullName = text(formData, "full_name", 160);
  const cpf = digits(optional(formData, "cpf", 30));
  const phone = brazilPhone(optional(formData, "phone", 30));
  const whatsapp = brazilPhone(optional(formData, "whatsapp", 30));
  const postalCode = digits(optional(formData, "postal_code", 20));
  const state = optional(formData, "state", 2)?.toUpperCase() ?? null;
  const birthDate = optional(formData, "birth_date", 10);

  if (fullName.length < 2) redirect(patientPath(publicId, { error: "invalid_name", panel: "edit" }));
  if (!validCpf(cpf)) redirect(patientPath(publicId, { error: "invalid_cpf", panel: "edit" }));
  if (phone && (phone.length < 11 || phone.length > 16)) redirect(patientPath(publicId, { error: "invalid_phone", panel: "edit" }));
  if (whatsapp && (whatsapp.length < 11 || whatsapp.length > 16)) redirect(patientPath(publicId, { error: "invalid_phone", panel: "edit" }));
  if (postalCode && postalCode.length !== 8) redirect(patientPath(publicId, { error: "invalid_postal_code", panel: "edit" }));
  if (state && !/^[A-Z]{2}$/.test(state)) redirect(patientPath(publicId, { error: "invalid_state", panel: "edit" }));
  if (birthDate && (Number.isNaN(Date.parse(`${birthDate}T12:00:00Z`)) || birthDate > new Date().toISOString().slice(0, 10))) redirect(patientPath(publicId, { error: "invalid_birth_date", panel: "edit" }));

  const { error } = await context.supabase.from("patients").update({
    full_name: fullName,
    social_name: optional(formData, "social_name", 160),
    birth_date: birthDate,
    gender: optional(formData, "gender", 40),
    cpf_digits: cpf,
    phone_e164: phone,
    whatsapp_e164: whatsapp,
    email: optional(formData, "email", 254),
    address_line1: optional(formData, "address_line1", 240),
    address_line2: optional(formData, "address_line2", 160),
    neighborhood: optional(formData, "neighborhood", 120),
    city: optional(formData, "city", 120),
    state,
    postal_code_digits: postalCode,
    emergency_contact_name: optional(formData, "emergency_contact_name", 160),
    emergency_contact_phone_e164: brazilPhone(optional(formData, "emergency_contact_phone", 30)),
    notes: optional(formData, "notes", 4000),
  }).eq("clinic_id", context.clinic.id).eq("id", patient.id);

  if (error) redirect(patientPath(publicId, { error: error.code === "23505" ? "duplicate_cpf" : "save_failed", panel: "edit" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "patient" }));
}

export async function createMedicalAlert(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const alertType = text(formData, "alert_type", 40);
  const severity = text(formData, "severity", 20);
  const description = text(formData, "description", 1000);
  if (!alertTypes.has(alertType) || !alertSeverities.has(severity) || description.length < 3) {
    redirect(patientPath(publicId, { error: "invalid_alert", panel: "alert" }));
  }

  const { error } = await context.supabase.from("patient_medical_alerts").insert({
    clinic_id: context.clinic.id,
    patient_id: patient.id,
    alert_type: alertType,
    severity,
    description,
  });
  if (error) redirect(patientPath(publicId, { error: "save_failed", panel: "alert" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "alert" }));
}

export async function verifyMedicalAlert(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const alertPublicId = text(formData, "alert_public_id", 50);
  await context.supabase.from("patient_medical_alerts").update({
    verified_at: new Date().toISOString(),
    verified_by: context.profile.id,
  }).eq("clinic_id", context.clinic.id).eq("patient_id", patient.id).eq("public_id", alertPublicId).is("deleted_at", null);
  refreshPatient(publicId);
}

export async function archiveMedicalAlert(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const alertPublicId = text(formData, "alert_public_id", 50);
  await context.supabase.from("patient_medical_alerts").update({ active: false })
    .eq("clinic_id", context.clinic.id).eq("patient_id", patient.id).eq("public_id", alertPublicId).is("deleted_at", null);
  refreshPatient(publicId);
}

export async function submitAnamnesis(publicId: string, formData: FormData) {
  const { context } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  let questionIds: string[] = [];
  try {
    questionIds = JSON.parse(text(formData, "question_ids", 12000)) as string[];
  } catch {
    redirect(patientPath(publicId, { error: "invalid_anamnesis", panel: "anamnesis" }));
  }
  if (!Array.isArray(questionIds) || questionIds.length === 0 || questionIds.length > 80) {
    redirect(patientPath(publicId, { error: "invalid_anamnesis", panel: "anamnesis" }));
  }

  const answers = questionIds.map((questionId) => {
    const rawSelection = text(formData, `selection_${questionId}`, 20) as Selection;
    const selection = selections.has(rawSelection) ? rawSelection : null;
    return { question_public_id: questionId, selection, answer_text: optional(formData, `note_${questionId}`, 1000) };
  });

  const { error } = await context.supabase.rpc("submit_patient_anamnesis", {
    p_patient_public_id: publicId,
    p_answers: answers as Json,
    p_answered_by_patient: formData.get("answered_by_patient") === "on",
  });
  if (error) redirect(patientPath(publicId, { error: "invalid_anamnesis", panel: "anamnesis" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "anamnesis" }));
}

function validFdi(toothSet: ToothSet, toothCode: number) {
  const value = String(toothCode);
  return toothSet === "permanent" ? /^[1-4][1-8]$/.test(value) : /^[5-8][1-5]$/.test(value);
}

export async function createOdontogramEntry(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const toothSet = text(formData, "tooth_set", 20) as ToothSet;
  const entryKind = text(formData, "entry_kind", 30) as EntryKind;
  const toothCode = Number(text(formData, "tooth_code", 2));
  const description = text(formData, "description", 1600);
  const selectedSurfaces = formData.getAll("surfaces").map(String).filter((surface): surface is Surface => surfaces.has(surface as Surface));
  if (!toothSets.has(toothSet) || !entryKinds.has(entryKind) || !validFdi(toothSet, toothCode) || description.length < 3) {
    redirect(patientPath(publicId, { error: "invalid_odontogram", panel: "odontogram" }));
  }

  const { error } = await context.supabase.from("odontogram_entries").insert({
    clinic_id: context.clinic.id,
    patient_id: patient.id,
    recorded_by: context.profile.id,
    entry_kind: entryKind,
    tooth_set: toothSet,
    region: "tooth",
    tooth_code: toothCode,
    surfaces: selectedSurfaces,
    description,
    status: entryKind === "executed_procedure" ? "completed" : "planned",
    occurred_at: new Date().toISOString(),
  });
  if (error) redirect(patientPath(publicId, { error: "save_failed", panel: "odontogram" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "odontogram" }));
}

export async function createClinicalEvolution(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const description = text(formData, "description", 8000);
  const occurredDate = text(formData, "occurred_date", 10);
  const occurredTime = text(formData, "occurred_time", 5);
  const shouldSign = formData.get("sign_now") === "on";
  if (description.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(occurredDate) || !/^\d{2}:\d{2}$/.test(occurredTime)) {
    redirect(patientPath(publicId, { error: "invalid_evolution", panel: "evolution" }));
  }
  let occurredAt: string;
  try {
    occurredAt = localDateTimeToIso(occurredDate, occurredTime, context.clinic.timezone);
  } catch {
    redirect(patientPath(publicId, { error: "invalid_evolution", panel: "evolution" }));
  }
  const now = new Date().toISOString();
  const signatureHash = shouldSign
    ? createHash("sha256").update([context.clinic.id, patient.id, context.profile.id, occurredAt, description].join("|")).digest("hex")
    : null;
  const { error } = await context.supabase.from("clinical_evolutions").insert({
    clinic_id: context.clinic.id,
    patient_id: patient.id,
    professional_profile_id: context.profile.id,
    description,
    occurred_at: occurredAt,
    status: shouldSign ? "signed" : "final",
    signed_at: shouldSign ? now : null,
    signed_by: shouldSign ? context.profile.id : null,
    signature_hash: signatureHash,
    signature_provider: shouldSign ? "sha256-v1" : null,
  });
  if (error) redirect(patientPath(publicId, { error: "save_failed", panel: "evolution" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "evolution" }));
}

export type FileRegistrationResult = { ok: boolean; message: string };

export async function registerPatientFile(publicId: string, input: {
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  description: string;
}): Promise<FileRegistrationResult> {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) return { ok: false, message: "Seu perfil não pode anexar arquivos clínicos." };
  const expectedPrefix = `${context.clinic.id}/${patient.public_id}/`;
  if (!input.storagePath.startsWith(expectedPrefix) || input.originalName.trim().length === 0 || input.originalName.length > 240 || !allowedMimeTypes.has(input.mimeType) || !Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > 15 * 1024 * 1024 || !fileCategories.has(input.category)) {
    return { ok: false, message: "Arquivo inválido ou fora do limite de 15 MB." };
  }
  const { error } = await context.supabase.from("patient_files").insert({
    clinic_id: context.clinic.id,
    patient_id: patient.id,
    storage_path: input.storagePath,
    original_name: input.originalName.trim(),
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    category: input.category,
    description: input.description.trim().slice(0, 1000) || null,
    uploaded_by: context.profile.id,
  });
  if (error) return { ok: false, message: "O arquivo subiu, mas não foi vinculado ao prontuário." };
  refreshPatient(publicId);
  return { ok: true, message: "Arquivo anexado ao prontuário." };
}

export async function archivePatientFile(publicId: string, formData: FormData) {
  const { context, patient } = await getOwnedPatient(publicId);
  if (!clinicalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const filePublicId = text(formData, "file_public_id", 50);
  await context.supabase.from("patient_files").update({ deleted_at: new Date().toISOString() })
    .eq("clinic_id", context.clinic.id).eq("patient_id", patient.id).eq("public_id", filePublicId).is("deleted_at", null);
  refreshPatient(publicId);
}

type BudgetItemInput = {
  catalog_public_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  tooth_code: number | null;
  surfaces: string[];
};

function amount(formData: FormData, key: string) {
  const raw = text(formData, key, 30).replace(",", ".");
  return raw ? Number(raw) : 0;
}

export async function createPatientBudget(publicId: string, formData: FormData) {
  const { context } = await getOwnedPatient(publicId);
  if (!budgetRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));

  const description = text(formData, "description", 200);
  const discountType = text(formData, "discount_type", 30) as DiscountType;
  const discountValue = amount(formData, "discount_value");
  const entryAmount = amount(formData, "entry_amount");
  const installmentCount = Number(text(formData, "installment_count", 3) || "0");
  const firstDueDate = text(formData, "first_due_date", 10);
  let items: BudgetItemInput[] = [];
  try {
    items = JSON.parse(text(formData, "items", 50000)) as BudgetItemInput[];
  } catch {
    redirect(patientPath(publicId, { error: "invalid_budget", panel: "budget" }));
  }

  const validItems = Array.isArray(items) && items.length > 0 && items.length <= 50 && items.every((item) =>
    typeof item.name === "string" && item.name.trim().length >= 2 && item.name.length <= 240 &&
    Number.isFinite(item.quantity) && item.quantity > 0 && item.quantity <= 100 &&
    Number.isFinite(item.unit_price) && item.unit_price >= 0 &&
    (item.tooth_code === null || (/^[1-4][1-8]$/.test(String(item.tooth_code)))) &&
    Array.isArray(item.surfaces)
  );
  if (description.length < 2 || !discountTypes.has(discountType) || discountValue < 0 ||
      (discountType === "percentage" && discountValue > 100) || entryAmount < 0 ||
      !Number.isInteger(installmentCount) || installmentCount < 0 || installmentCount > 60 ||
      (installmentCount > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(firstDueDate)) || !validItems) {
    redirect(patientPath(publicId, { error: "invalid_budget", panel: "budget" }));
  }

  const normalizedItems = items.map((item) => ({
    catalog_public_id: item.catalog_public_id || null,
    name: item.name.trim(),
    quantity: Math.round(item.quantity * 100) / 100,
    unit_price: Math.round(item.unit_price * 100) / 100,
    tooth_code: item.tooth_code,
    surfaces: item.surfaces,
  }));
  const { error } = await context.supabase.rpc("create_patient_budget", {
    p_patient_public_id: publicId,
    p_description: description,
    p_discount_type: discountType,
    p_discount_value: discountValue,
    p_entry_amount: entryAmount,
    p_remaining_installments_count: installmentCount,
    p_first_due_date: firstDueDate || new Date().toISOString().slice(0, 10),
    p_items: normalizedItems as Json,
    p_observations: optional(formData, "observations", 4000) ?? undefined,
  });
  if (error) redirect(patientPath(publicId, { error: "invalid_budget", panel: "budget" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "budget" }));
}

export async function approvePatientBudget(publicId: string, formData: FormData) {
  const { context } = await getOwnedPatient(publicId);
  if (!approvalRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const budgetPublicId = text(formData, "budget_public_id", 50);
  if (!/^[0-9a-f-]{36}$/i.test(budgetPublicId)) redirect(patientPath(publicId, { error: "invalid_budget" }));
  const { error } = await context.supabase.rpc("approve_patient_budget", { p_budget_public_id: budgetPublicId });
  if (error) redirect(patientPath(publicId, { error: "approve_budget_failed" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "budget_approved" }));
}

export async function receiveInstallmentPayment(publicId: string, formData: FormData) {
  const { context } = await getOwnedPatient(publicId);
  if (!financeRoles.has(context.role)) redirect(patientPath(publicId, { error: "forbidden" }));
  const installmentPublicId = text(formData, "installment_public_id", 50);
  const paymentMethodPublicId = text(formData, "payment_method_public_id", 50);
  const receivedAmount = amount(formData, "amount");
  const cardInstallments = Number(text(formData, "card_installments", 2) || "1");
  if (!/^[0-9a-f-]{36}$/i.test(installmentPublicId) || !/^[0-9a-f-]{36}$/i.test(paymentMethodPublicId) ||
      !Number.isFinite(receivedAmount) || receivedAmount <= 0 || !Number.isInteger(cardInstallments) || cardInstallments < 1 || cardInstallments > 24) {
    redirect(patientPath(publicId, { error: "invalid_payment" }));
  }
  const { error } = await context.supabase.rpc("register_installment_payment", {
    p_installment_public_id: installmentPublicId,
    p_payment_method_public_id: paymentMethodPublicId,
    p_amount: receivedAmount,
    p_card_installments: cardInstallments,
    p_observations: optional(formData, "observations", 2000) ?? undefined,
  });
  if (error) redirect(patientPath(publicId, { error: "payment_failed" }));
  refreshPatient(publicId);
  redirect(patientPath(publicId, { saved: "payment" }));
}
