"use server";

import { revalidatePath } from "next/cache";
import { getClinicContext } from "@/lib/clinic-context";

const closingRoles = new Set(["owner", "admin", "financial"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function transitionCommission(
  publicId: string,
  nextStatus: "open" | "approved" | "paid",
) {
  const context = await getClinicContext();
  if (!context || !closingRoles.has(context.role)) {
    return { ok: false, message: "Seu perfil não pode fechar comissões." };
  }

  if (
    !uuidPattern.test(publicId) ||
    !["open", "approved", "paid"].includes(nextStatus)
  ) {
    return { ok: false, message: "Comissão ou transição inválida." };
  }

  const { data: commission } = await context.supabase
    .from("commissions")
    .select("id, status")
    .eq("clinic_id", context.clinic.id)
    .eq("public_id", publicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!commission)
    return { ok: false, message: "Comissão não encontrada nesta clínica." };

  const validTransition =
    (commission.status === "open" && nextStatus === "approved") ||
    (commission.status === "approved" && ["open", "paid"].includes(nextStatus));

  if (!validTransition)
    return { ok: false, message: "Esta comissão não permite essa transição." };

  const { error } = await context.supabase
    .from("commissions")
    .update({ status: nextStatus })
    .eq("clinic_id", context.clinic.id)
    .eq("id", commission.id);

  if (error)
    return { ok: false, message: "Não foi possível atualizar a comissão." };

  revalidatePath("/clinic/commissions/ledger");
  return {
    ok: true,
    message:
      nextStatus === "approved"
        ? "Comissão aprovada."
        : nextStatus === "paid"
          ? "Comissão marcada como paga."
          : "Comissão reaberta.",
  };
}
