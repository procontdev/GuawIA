import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  MapPin,
  Phone,
  Search,
  Users,
  ClipboardCheck,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import type { EventLead, EventLeadStatus } from "@/types/eventLead.types";
import {
  fetchEventLeads,
  updateEventLeadStatus,
} from "@/services/eventLeads.service";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-PE");
}

function statusMeta(status: EventLeadStatus) {
  switch (status) {
    case "nuevo":
      return {
        label: "Nuevo",
        className: "bg-slate-100 text-slate-800 border-slate-200",
      };
    case "contactado":
      return {
        label: "Contactado",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "cotizado":
      return {
        label: "Cotizado",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "cerrado":
      return {
        label: "Cerrado",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-800 border-slate-200",
      };
  }
}

function KPI({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: any;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}

function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: EventLead;
  onStatusChange: (id: string, next: EventLeadStatus) => void;
}) {
  const meta = statusMeta(lead.status);

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              {lead.contactName || "Sin nombre"}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Lead #{lead.id.slice(0, 8)}
            </p>
          </div>

          <Badge className={`rounded-full border px-3 py-1 ${meta.className}`}>
            {meta.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="h-4 w-4" />
            <span>{lead.phone || "Sin teléfono"}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Users className="h-4 w-4" />
            <span>{lead.guestCount || 0} asistentes</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <CalendarRange className="h-4 w-4" />
            <span>{lead.eventDate ? formatDate(lead.eventDate) : "Sin fecha"}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="h-4 w-4" />
            <span>{lead.location || "Sin ubicación"}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Interés
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {lead.chaufaChoice || "Sin definir"}
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Observaciones
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {lead.notes || "Sin observaciones"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">Actualizar estado</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(["nuevo", "contactado", "cotizado", "cerrado"] as EventLeadStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={lead.status === status ? "default" : "outline"}
                  className="rounded-2xl"
                  disabled={lead.status === status}
                  onClick={() => onStatusChange(lead.id, status)}
                >
                  {statusMeta(status).label}
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventLeadsPage() {
  const [leads, setLeads] = useState<EventLead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    try {
      const data = await fetchEventLeads();
      setLeads(data);
    } catch (error) {
      console.error("Error loading event leads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const text =
        `${lead.contactName} ${lead.phone} ${lead.location} ${lead.chaufaChoice} ${lead.notes}`.toLowerCase();

      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const kpis = useMemo(() => {
    return {
      nuevos: leads.filter((l) => l.status === "nuevo").length,
      seguimiento: leads.filter(
        (l) => l.status === "contactado" || l.status === "cotizado"
      ).length,
      cerrados: leads.filter((l) => l.status === "cerrado").length,
      total: leads.length,
    };
  }, [leads]);

  const handleStatusChange = async (id: string, next: EventLeadStatus) => {
  const previous = leads;
  const lead = leads.find((l) => l.id === id);

  setLeads((current) =>
    current.map((lead) =>
      lead.id === id ? { ...lead, status: next } : lead
    )
  );

  try {
    await updateEventLeadStatus(id, next);

    toast.success("Estado del lead actualizado", {
      description: `${lead?.contactName || "Lead"} ahora está en "${statusMeta(next).label}".`,
    });
  } catch (error) {
    console.error("Error updating event lead status", error);
    setLeads(previous);

    toast.error("No se pudo actualizar el lead", {
      description: lead?.contactName
        ? `Se revirtió el cambio para ${lead.contactName}.`
        : "Se revirtió el cambio realizado.",
    });
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-8 text-slate-500">
            Cargando leads...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI
          title="Leads nuevos"
          value={kpis.nuevos}
          hint="Oportunidades recién captadas"
          icon={Users}
        />
        <KPI
          title="En seguimiento"
          value={kpis.seguimiento}
          hint="Contactados o cotizados"
          icon={ClipboardCheck}
        />
        <KPI
          title="Cerrados"
          value={kpis.cerrados}
          hint="Leads con cierre comercial"
          icon={CheckCircle2}
        />
        <KPI
          title="Total leads"
          value={kpis.total}
          hint="Base visible en operación"
          icon={FileText}
        />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono, ubicación o interés"
              className="h-12 rounded-2xl pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="contactado">Contactado</SelectItem>
              <SelectItem value="cotizado">Cotizado</SelectItem>
              <SelectItem value="cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        {filteredLeads.length ? (
          filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <Card className="rounded-3xl border border-dashed border-slate-200 bg-white">
            <CardContent className="p-12 text-center text-slate-500">
              No hay leads que coincidan con los filtros aplicados.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}