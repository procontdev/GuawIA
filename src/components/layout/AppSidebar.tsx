import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  MapPinned,
  Package2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnvironmentLabel } from "@/services/env";
import { USE_MOCK_API } from "@/services/api";

const items = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/kitchen",
    label: "Pedidos Cocina",
    icon: ClipboardList,
  },
  {
    to: "/orders",
    label: "Pedidos",
    icon: Package2,
  },
  {
    to: "/events",
    label: "Leads de Eventos",
    icon: CalendarRange,
  },
  {
    to: "/delivery-zones",
    label: "Zonas de Delivery",
    icon: MapPinned,
  },
];

export default function AppSidebar() {
  const environmentLabel = getEnvironmentLabel();

  return (
    <aside className="border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Guaw IA
          </div>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            Ops Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Demo operativa comercial
          </p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm font-medium text-slate-900">
              {environmentLabel}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {USE_MOCK_API
                ? "La aplicación está usando datos de demostración."
                : "La aplicación está conectada a datos reales."}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}