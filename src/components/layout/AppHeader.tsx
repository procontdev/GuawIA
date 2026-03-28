import { Database, Sparkles } from "lucide-react";
import { Badge } from "@/ui/badge";
import { getEnvironmentDescription, getEnvironmentLabel, USE_MOCK_API } from "@/services/env";

type AppHeaderProps = {
  pathname: string;
};

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard General",
    subtitle: "Resumen ejecutivo de la operación delivery y leads de eventos",
  },
  "/kitchen": {
    title: "Vista Cocina / Comanda",
    subtitle: "Seguimiento de pedidos delivery por estado operativo",
  },
  "/events": {
    title: "Leads de Eventos",
    subtitle: "Registro comercial y seguimiento de oportunidades",
  },
};

export default function AppHeader({ pathname }: AppHeaderProps) {
  const meta = pageMeta[pathname] ?? pageMeta["/"];
  const label = getEnvironmentLabel();
  const description = getEnvironmentDescription();

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {meta.title}
          </h2>
          <p className="text-sm text-slate-500">{meta.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            className={
              USE_MOCK_API
                ? "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50"
                : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
            }
          >
            {USE_MOCK_API ? (
              <Sparkles className="mr-1 h-3.5 w-3.5" />
            ) : (
              <Database className="mr-1 h-3.5 w-3.5" />
            )}
            {label}
          </Badge>

          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 lg:block">
            {description}
          </div>
        </div>
      </div>
    </header>
  );
}