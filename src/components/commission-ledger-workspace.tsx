"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BadgeCheck,
  BadgeDollarSign,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Menu,
  RotateCcw,
  Search,
  ShieldCheck,
  Undo2,
  UsersRound,
} from "lucide-react";
import { transitionCommission } from "@/app/clinic/commissions/ledger/actions";
import { ClinicAdminNav } from "@/components/clinic-admin-nav";
import { WorkspaceShell } from "@/components/workspace-shell";

type CommissionStatus = "open" | "approved" | "paid" | "cancelled" | "reversed";
type Entry = {
  publicId: string;
  professionalProfileId: string;
  professionalName: string;
  professionalSpecialty: string | null;
  status: CommissionStatus;
  triggerEvent: "treatment_completed" | "installment_paid";
  calculationType: "percentage" | "fixed_amount";
  calculationBasis:
    | "procedure_gross"
    | "procedure_net_after_discount"
    | "installment_gross"
    | "payment_net";
  basisAmount: number;
  ruleValue: number;
  commissionAmount: number;
  accruedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
  originLabel: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const statusMeta: Record<
  CommissionStatus,
  { label: string; className: string }
> = {
  open: { label: "Aberta", className: "bg-amber-50 text-amber-700" },
  approved: { label: "Aprovada", className: "bg-sky-50 text-sky-700" },
  paid: { label: "Paga", className: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelada", className: "bg-slate-100 text-slate-500" },
  reversed: { label: "Revertida", className: "bg-rose-50 text-rose-700" },
};

function amountByStatus(entries: Entry[], status: CommissionStatus) {
  return entries.reduce(
    (sum, entry) =>
      sum + (entry.status === status ? entry.commissionAmount : 0),
    0,
  );
}

function calculationLabel(entry: Entry) {
  if (entry.calculationType === "fixed_amount")
    return currency.format(entry.ruleValue);
  return `${entry.ruleValue}% sobre ${entry.calculationBasis === "payment_net" ? "o líquido recebido" : entry.calculationBasis === "installment_gross" ? "o bruto recebido" : entry.calculationBasis === "procedure_net_after_discount" ? "o líquido do procedimento" : "o bruto do procedimento"}`;
}

export function CommissionLedgerWorkspace({
  clinicName,
  userName,
  canManage,
  entries,
  loadError,
}: {
  clinicName: string;
  userName: string;
  canManage: boolean;
  entries: Entry[];
  loadError: string | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CommissionStatus>("all");
  const [professional, setProfessional] = useState("all");
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const professionals = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((entry) =>
      map.set(entry.professionalProfileId, entry.professionalName),
    );
    return Array.from(map, ([profileId, name]) => ({ profileId, name })).sort(
      (a, b) => a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [entries]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return entries.filter((entry) => {
      const matchesQuery =
        !normalized ||
        [entry.professionalName, entry.originLabel, entry.professionalSpecialty]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalized);
      return (
        matchesQuery &&
        (status === "all" || entry.status === status) &&
        (professional === "all" || entry.professionalProfileId === professional)
      );
    });
  }, [entries, professional, query, status]);

  const professionalSummary = useMemo(
    () =>
      professionals.map((item) => {
        const ownEntries = entries.filter(
          (entry) => entry.professionalProfileId === item.profileId,
        );
        return {
          ...item,
          open: amountByStatus(ownEntries, "open"),
          approved: amountByStatus(ownEntries, "approved"),
          paid: amountByStatus(ownEntries, "paid"),
          count: ownEntries.length,
        };
      }),
    [entries, professionals],
  );

  function changeStatus(
    publicId: string,
    nextStatus: "open" | "approved" | "paid",
  ) {
    setFeedback(null);
    setPendingId(publicId);
    startTransition(async () => {
      const result = await transitionCommission(publicId, nextStatus);
      setFeedback(result);
      setPendingId(null);
    });
  }

  return (
    <WorkspaceShell clinicName={clinicName} userName={userName}>
      <main className="min-w-0">
        <header className="flex min-h-[68px] items-center gap-3 border-b border-[#dce2df] bg-white px-4 py-3 sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-600 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={21} />
          </button>
          <div>
            <p className="text-xs font-medium text-[#68736f]">
              Administração clínica
            </p>
            <h1 className="text-lg font-semibold tracking-[-.02em]">
              Fechamento de comissões
            </h1>
          </div>
        </header>

        <section className="space-y-5 p-4 sm:p-6">
          <ClinicAdminNav active="commission-ledger" />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Aguardando aprovação",
                value: amountByStatus(entries, "open"),
                icon: Clock3,
                tone: "text-amber-600",
              },
              {
                label: "A pagar",
                value: amountByStatus(entries, "approved"),
                icon: BadgeCheck,
                tone: "text-sky-600",
              },
              {
                label: "Comissões pagas",
                value: amountByStatus(entries, "paid"),
                icon: CircleDollarSign,
                tone: "text-emerald-600",
              },
              {
                label: "Revertidas",
                value: amountByStatus(entries, "reversed"),
                icon: Undo2,
                tone: "text-rose-600",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[#dce2df] bg-white p-4 shadow-[0_8px_28px_rgba(23,32,29,.035)]"
              >
                <div
                  className={`flex items-center gap-2 text-xs font-medium ${metric.tone}`}
                >
                  <metric.icon size={16} />
                  {metric.label}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                  {currency.format(metric.value)}
                </p>
              </div>
            ))}
          </div>

          {!canManage ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} />
              <span>
                Você pode consultar o extrato. Aprovação e pagamento são
                restritos a proprietário, administrador e financeiro.
              </span>
            </div>
          ) : null}
          {loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}
          {feedback ? (
            <div
              aria-live="polite"
              className={`rounded-2xl border p-4 text-sm ${feedback.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#dce2df] bg-white p-5">
            <div className="flex items-center gap-2">
              <UsersRound size={18} className="text-[#176b55]" />
              <h2 className="font-semibold">Fechamento por profissional</h2>
            </div>
            {professionalSummary.length ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {professionalSummary.map((item) => (
                  <button
                    key={item.profileId}
                    type="button"
                    onClick={() => setProfessional(item.profileId)}
                    className="grid gap-3 rounded-2xl border border-[#e2e7e4] p-4 text-left transition hover:border-[#176b55]/35 hover:bg-[#f9fbfa] sm:grid-cols-[minmax(0,1fr)_repeat(3,auto)] sm:items-center"
                  >
                    <span>
                      <span className="block text-sm font-semibold">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-[11px] text-[#7a8581]">
                        {item.count} lançamento(s)
                      </span>
                    </span>
                    <span className="text-xs text-[#68736f]">
                      Aberto
                      <strong className="mt-1 block text-sm text-[#17201d]">
                        {currency.format(item.open)}
                      </strong>
                    </span>
                    <span className="text-xs text-[#68736f]">
                      A pagar
                      <strong className="mt-1 block text-sm text-[#17201d]">
                        {currency.format(item.approved)}
                      </strong>
                    </span>
                    <span className="text-xs text-[#68736f]">
                      Pago
                      <strong className="mt-1 block text-sm text-emerald-700">
                        {currency.format(item.paid)}
                      </strong>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#68736f]">
                Os profissionais aparecerão aqui quando houver comissões
                provisionadas.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dce2df] bg-white shadow-[0_10px_35px_rgba(23,32,29,.04)]">
            <div className="grid gap-3 border-b border-[#e2e7e4] p-4 lg:grid-cols-[minmax(260px,1fr)_190px_190px]">
              <label className="relative">
                <span className="sr-only">Buscar lançamento</span>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89928f]"
                  size={17}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar profissional ou origem"
                  className="h-10 w-full rounded-xl border border-[#dce2df] bg-[#f8faf9] pl-10 pr-4 text-sm outline-none focus:border-[#176b55] focus:bg-white focus:ring-4 focus:ring-[#176b55]/8"
                />
              </label>
              <select
                aria-label="Filtrar profissional"
                value={professional}
                onChange={(event) => setProfessional(event.target.value)}
                className="h-10 rounded-xl border border-[#dce2df] bg-white px-3 text-sm outline-none focus:border-[#176b55]"
              >
                <option value="all">Todos os profissionais</option>
                {professionals.map((item) => (
                  <option key={item.profileId} value={item.profileId}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrar status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as typeof status)
                }
                className="h-10 rounded-xl border border-[#dce2df] bg-white px-3 text-sm outline-none focus:border-[#176b55]"
              >
                <option value="all">Todos os status</option>
                <option value="open">Abertas</option>
                <option value="approved">Aprovadas</option>
                <option value="paid">Pagas</option>
                <option value="reversed">Revertidas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            {filtered.length ? (
              <div className="divide-y divide-[#edf0ee]">
                {filtered.map((entry) => (
                  <article
                    key={entry.publicId}
                    className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_140px_140px_auto] xl:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {entry.professionalName}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${statusMeta[entry.status].className}`}
                        >
                          {statusMeta[entry.status].label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#53615c]">
                        {entry.originLabel} ·{" "}
                        {entry.triggerEvent === "installment_paid"
                          ? "recebimento"
                          : "conclusão clínica"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7a8581]">
                        <span>{calculationLabel(entry)}</span>
                        <span>
                          Provisionada em{" "}
                          {dateTime.format(new Date(entry.accruedAt))}
                        </span>
                        {entry.reversalReason ? (
                          <span className="text-rose-600">
                            {entry.reversalReason}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="block text-xs text-[#7a8581]">Base</span>
                      <strong>{currency.format(entry.basisAmount)}</strong>
                    </div>
                    <div className="text-sm">
                      <span className="block text-xs text-[#7a8581]">
                        Comissão
                      </span>
                      <strong className="text-base">
                        {currency.format(entry.commissionAmount)}
                      </strong>
                    </div>
                    {canManage ? (
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {entry.status === "open" ? (
                          <button
                            disabled={isPending}
                            onClick={() =>
                              changeStatus(entry.publicId, "approved")
                            }
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#176b55] px-3 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            {pendingId === entry.publicId
                              ? "Aprovando..."
                              : "Aprovar"}
                          </button>
                        ) : null}
                        {entry.status === "approved" ? (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() =>
                                changeStatus(entry.publicId, "open")
                              }
                              className="flex h-9 items-center gap-1.5 rounded-xl border border-[#dce2df] px-3 text-xs font-semibold disabled:opacity-50"
                            >
                              <RotateCcw size={14} />
                              Reabrir
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() =>
                                changeStatus(entry.publicId, "paid")
                              }
                              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#17201d] px-3 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              <BadgeDollarSign size={14} />
                              {pendingId === entry.publicId
                                ? "Baixando..."
                                : "Marcar paga"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <span />
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef3f1] text-[#176b55]">
                    <BadgeDollarSign size={23} />
                  </span>
                  <h2 className="mt-4 font-semibold">
                    {entries.length
                      ? "Nenhum lançamento encontrado"
                      : "Nenhuma comissão provisionada"}
                  </h2>
                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#68736f]">
                    {entries.length
                      ? "Ajuste os filtros para consultar o extrato."
                      : "As comissões aparecerão automaticamente após a conclusão de procedimentos ou o recebimento de parcelas."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </WorkspaceShell>
  );
}
