"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays, CircleDollarSign, FileText, LayoutDashboard, LogOut,
  Settings, Stethoscope, Users,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";

const navigation = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/" },
  { label: "Agenda", icon: CalendarDays, href: "/agenda" },
  { label: "Pacientes", icon: Users, href: "/patients" },
  { label: "Clínica", icon: Stethoscope, href: "#" },
  { label: "Financeiro", icon: CircleDollarSign, href: "#" },
  { label: "Relatórios", icon: FileText, href: "#" },
] as const;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function WorkspaceShell({ children, clinicName, userName }: { children: ReactNode; clinicName: string; userName: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f3f5f4] text-[#17201d] lg:flex">
      <aside className="hidden min-h-screen w-[232px] shrink-0 flex-col bg-[#111a17] px-4 py-5 text-white lg:flex">
        <Link href="/" className="flex h-10 items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d8f66a] text-sm font-black text-[#17201d]">O</span>
          <span className="min-w-0"><span className="block text-[17px] font-semibold tracking-tight">Odonto</span><span className="block truncate text-[11px] text-white/45">{clinicName}</span></span>
        </Link>
        <nav className="mt-9 space-y-1" aria-label="Navegação principal">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : item.href !== "#" && pathname.startsWith(item.href);
            return <Link href={item.href} key={item.label} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-white/11 font-medium text-white" : "text-white/58 hover:bg-white/6 hover:text-white"}`}><item.icon size={18} strokeWidth={1.8} />{item.label}</Link>;
          })}
        </nav>
        <div className="mt-auto space-y-1">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/58 hover:bg-white/6 hover:text-white"><Settings size={18} />Configurações</button>
          <form action={signOut}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/58 hover:bg-white/6 hover:text-white"><LogOut size={18} />Sair</button></form>
          <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold">{initials(userName)}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{userName}</span><span className="block truncate text-[11px] text-white/42">Equipe da clínica</span></span></div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
