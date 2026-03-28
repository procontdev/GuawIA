import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { getDashboardMetrics } from "@/services/dashboard.service";
import type { DashboardMetrics } from "@/types/dashboard.types";

function currency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

function KPI({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Error loading dashboard metrics", error);
      }
    };

    loadMetrics();
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-8 text-slate-500">
            Cargando dashboard...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI
          title="Pedidos activos"
          value={metrics.activeOrders}
          hint="Pedidos aún en operación"
        />
        <KPI
          title="Pedidos del día"
          value={metrics.todayOrders}
          hint="Total visible en operación"
        />
        <KPI
          title="Leads de eventos"
          value={metrics.eventLeads}
          hint="Base actual de oportunidades"
        />
        <KPI
          title="Ticket promedio"
          value={currency(metrics.avgTicket)}
          hint="Promedio del delivery"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Resumen ejecutivo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-3">
                <ClipboardList className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Delivery operativo
              </h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Nuevos</span>
                  <span className="font-medium text-slate-900">
                    {metrics.newOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>En preparación</span>
                  <span className="font-medium text-slate-900">
                    {metrics.preparingOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Listos</span>
                  <span className="font-medium text-slate-900">
                    {metrics.readyOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Entregados</span>
                  <span className="font-medium text-slate-900">
                    {metrics.deliveredOrders}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <Link to="/kitchen">
                  <Button className="rounded-2xl">
                    Ver cocina
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-3">
                <CalendarRange className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Embudo de eventos
              </h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total leads</span>
                  <span className="font-medium text-slate-900">
                    {metrics.eventLeads}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pendientes</span>
                  <span className="font-medium text-slate-900">
                    {metrics.pendingEventLeads}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cerrados</span>
                  <span className="font-medium text-slate-900">
                    {metrics.closedEventLeads}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <Link to="/events">
                  <Button variant="outline" className="rounded-2xl">
                    Ver leads
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Indicadores clave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <ShoppingBag className="mt-0.5 h-5 w-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Ventas visibles</p>
                <p className="text-sm text-slate-500">
                  Total estimado en pedidos: {currency(metrics.totalSalesAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <CookingPot className="mt-0.5 h-5 w-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Capacidad operativa</p>
                <p className="text-sm text-slate-500">
                  {metrics.activeOrders} pedidos activos y {metrics.readyOrders} listos
                  para despacho.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <Users className="mt-0.5 h-5 w-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Pipeline comercial</p>
                <p className="text-sm text-slate-500">
                  {metrics.pendingEventLeads} oportunidades en seguimiento comercial.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Estado del sistema</p>
                <p className="text-sm text-slate-500">
                  Dashboard conectado a fuentes reales con fallback seguro a demo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}