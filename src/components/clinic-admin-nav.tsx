import Link from "next/link";
import { BadgePercent, Stethoscope } from "lucide-react";

const items = [
  { key: "treatments", label: "Tratamentos", href: "/clinic/treatments", icon: Stethoscope },
  { key: "commissions", label: "Comissões", href: "/clinic/commissions", icon: BadgePercent },
] as const;

export function ClinicAdminNav({ active }: { active: "treatments" | "commissions" }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#dce2df] bg-white p-1.5" aria-label="Administração clínica">
      {items.map((item) => <Link key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined} className={`flex min-w-max items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${active === item.key ? "bg-[#17201d] text-white shadow-sm" : "text-[#68736f] hover:bg-[#f3f6f4] hover:text-[#17201d]"}`}><item.icon size={16} />{item.label}</Link>)}
    </nav>
  );
}
