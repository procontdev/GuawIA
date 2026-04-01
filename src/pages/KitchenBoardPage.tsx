import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  Clock3,
  ChefHat,
  Bike,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Package2,
  Flame,
  AlertCircle,
  Bell,
  BellOff,
  Siren,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import type { Order, OrderStatus } from "@/types/order.types";
import { fetchOrders, updateOrderStatus } from "@/services/orders.service";

const REFRESH_INTERVAL_MS = 8000;
const HIGHLIGHT_DURATION_MS = 12000;
const ALERT_WEBHOOK_URL = import.meta.env.VITE_ALERT_WEBHOOK_URL || "";

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    border: string;
    icon: any;
  }
> = {
  nuevo: {
    label: "Nuevo",
    border: "border-slate-200",
    icon: Package2,
  },
  preparacion: {
    label: "En preparación",
    border: "border-amber-200",
    icon: ChefHat,
  },
  listo: {
    label: "Listo",
    border: "border-emerald-200",
    icon: Bike,
  },
  entregado: {
    label: "Entregado",
    border: "border-slate-200 opacity-90",
    icon: CheckCircle2,
  },
};

const STATUS_OPTIONS: OrderStatus[] = [
  "nuevo",
  "preparacion",
  "listo",
  "entregado",
];

const ALERTABLE_STATUSES: OrderStatus[] = ["nuevo", "preparacion", "listo"];

function resolvePreparationStart(order: Order) {
  return order.preparationStartedAt || order.updatedAt || order.createdAt;
}

function resolveReadyAt(order: Order) {
  return order.readyAt || order.updatedAt || null;
}

function minutesSince(dateIso: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000)
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

function relativeAgeLabel(dateIso: string) {
  const minutes = minutesSince(dateIso);
  if (minutes < 1) return "Hace instantes";
  if (minutes === 1) return "Hace 1 min";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Hace ${hours} h`;
}

function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <Badge variant="outline" className="gap-1 rounded-full px-3 py-1 text-xs">
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
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

function getHighlightStyles(status: OrderStatus) {
  switch (status) {
    case "nuevo":
      return "ring-4 ring-red-500/70 border-red-300 bg-red-50/50 animate-pulse";
    case "preparacion":
      return "ring-4 ring-amber-500/70 border-amber-300 bg-amber-50/60";
    case "listo":
      return "ring-4 ring-emerald-500/70 border-emerald-300 bg-emerald-50/60 animate-pulse";
    case "entregado":
      return "ring-4 ring-slate-400/60 border-slate-300 bg-slate-50";
    default:
      return "";
  }
}

function OrderCard({
  order,
  onStatusChange,
  isHighlighted = false,
  highlightedStatus,
}: {
  order: Order;
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => void;
  isHighlighted?: boolean;
  highlightedStatus?: OrderStatus;
}) {
  const waitingMinutes = minutesSince(order.createdAt);
  const isDelayed = waitingMinutes >= 20 && order.status !== "entregado";

  return (
    <Card
      className={[
        "rounded-3xl border shadow-sm transition-all duration-300",
        STATUS_META[order.status].border,
        isHighlighted && highlightedStatus
          ? getHighlightStyles(highlightedStatus)
          : "",
      ].join(" ")}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              {order.code}
            </CardTitle>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={order.status} />

              <Badge variant="outline" className="rounded-full">
                <Clock3 className="mr-1 h-3.5 w-3.5" />
                {relativeAgeLabel(order.createdAt)}
              </Badge>

              {isDelayed ? (
                <Badge className="rounded-full gap-1 bg-red-600 text-white hover:bg-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Atención
                </Badge>
              ) : null}

              {isHighlighted && highlightedStatus ? (
                <Badge className="rounded-full gap-1 bg-slate-900 text-white hover:bg-slate-900">
                  <Siren className="h-3.5 w-3.5" />
                  Estado actualizado
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-900">
              {currency(Number(order.total || 0))}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <User className="h-4 w-4" />
            <span className="font-medium">
              {order.customerName || "Sin nombre"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="h-4 w-4" />
            <span>{order.phone || "Sin teléfono"}</span>
          </div>

          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="mt-0.5 h-4 w-4" />
            <div>
              <div>{order.address || "Sin dirección"}</div>
              <div className="text-xs text-slate-500">
                {order.district || "Sin distrito"} ·{" "}
                {order.reference || "Sin referencia"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Flame className="h-4 w-4" />
            Pedido
          </div>

          <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 p-3">
            {order.items.map((item, idx) => (
              <div key={`${order.id}-${idx}`} className="rounded-2xl bg-white p-3">
                <p className="font-medium text-slate-900">
                  {item.qty} x {item.name}
                </p>
                {item.extras?.length ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Extras: {item.extras.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
          <div>
            <p className="text-slate-500">Delivery</p>
            <p className="font-medium text-slate-900">
              {currency(Number(order.deliveryFee || 0))}
            </p>
          </div>

          <div>
            <p className="text-slate-500">ETA</p>
            <p className="font-medium text-slate-900">
              {order.etaMin ? `${order.etaMin} min` : "Finalizado"}
            </p>
          </div>
        </div>

        {order.notes ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-medium">Observación:</span> {order.notes}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">Cambiar estado</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status}
                variant={order.status === status ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => onStatusChange(order.id, status)}
                disabled={order.status === status}
              >
                {STATUS_META[status].label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusColumn({
  title,
  status,
  orders,
  onStatusChange,
  highlightedOrders,
}: {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => void;
  highlightedOrders: Record<string, OrderStatus>;
}) {
  const Icon = STATUS_META[status].icon;

  return (
    <div className="min-w-[320px] flex-1">
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-slate-100 p-2">
            <Icon className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{orders.length} pedido(s)</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length ? (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              isHighlighted={Boolean(highlightedOrders[order.id])}
              highlightedStatus={highlightedOrders[order.id]}
            />
          ))
        ) : (
          <Card className="rounded-3xl border border-dashed border-slate-200 bg-white/80 shadow-none">
            <CardContent className="flex min-h-[180px] items-center justify-center p-6 text-center text-sm text-slate-500">
              No hay pedidos en esta columna.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function KitchenBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [viewMode, setViewMode] = useState("board");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [highlightedOrders, setHighlightedOrders] = useState<
    Record<string, OrderStatus>
  >({});

  const previousOrdersRef = useRef<Record<string, OrderStatus>>({});
  const initializedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRefs = useRef<Record<string, number>>({});

  const highlightOrder = useCallback((orderId: string, status: OrderStatus) => {
    setHighlightedOrders((prev) => ({ ...prev, [orderId]: status }));

    const existingTimeout = timeoutRefs.current[orderId];
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    timeoutRefs.current[orderId] = window.setTimeout(() => {
      setHighlightedOrders((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      delete timeoutRefs.current[orderId];
    }, HIGHLIGHT_DURATION_MS);
  }, []);

  const playAlertSound = useCallback(async (status: OrderStatus) => {
    if (!soundEnabled || !audioRef.current) return;
    if (!ALERTABLE_STATUSES.includes(status)) return;

    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = status === "listo" ? 1.08 : 1;
      await audioRef.current.play();
    } catch (error) {
      console.warn("No se pudo reproducir el audio", error);
    }
  }, [soundEnabled]);

  const notifyPhysicalAlert = useCallback(
    async (order: Order, nextStatus: OrderStatus) => {
      if (!ALERT_WEBHOOK_URL) return;
      if (!ALERTABLE_STATUSES.includes(nextStatus)) return;

      try {
        await fetch(ALERT_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            orderCode: order.code,
            customerName: order.customerName,
            phone: order.phone,
            previousStatus: previousOrdersRef.current[order.id] || null,
            nextStatus,
            source: "kitchen-board",
            triggeredAt: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("No se pudo disparar la alerta física", error);
      }
    },
    []
  );

  const triggerAlert = useCallback(
    async (order: Order, nextStatus: OrderStatus, source: "remote" | "local") => {
      highlightOrder(order.id, nextStatus);
      await playAlertSound(nextStatus);
      await notifyPhysicalAlert(order, nextStatus);

      toast.success(
        source === "remote"
          ? "Cambio detectado en tiempo real"
          : "Estado del pedido actualizado",
        {
          description: `${order.code || "Pedido"} ahora está en "${STATUS_META[nextStatus].label}".`,
        }
      );
    },
    [highlightOrder, notifyPhysicalAlert, playAlertSound]
  );

  const enableSound = useCallback(async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/order-alert.mp3");
      }

      audioRef.current.volume = 1;
      audioRef.current.preload = "auto";

      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      setSoundEnabled(true);

      toast.success("Alertas sonoras activadas", {
        description: "El tablero ya puede reproducir alarmas.",
      });
    } catch (error) {
      console.error("No se pudo habilitar el audio", error);
      toast.error("No se pudo habilitar el audio", {
        description:
          "Haz clic nuevamente después de interactuar con la página.",
      });
    }
  }, []);

  const disableSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSoundEnabled(false);
    toast("Alertas sonoras desactivadas");
  }, []);

  const processIncomingOrders = useCallback(
    async (data: Order[]) => {
      const nextStatusMap: Record<string, OrderStatus> = {};
      data.forEach((order) => {
        nextStatusMap[order.id] = order.status;
      });

      if (initializedRef.current) {
        for (const order of data) {
          const previousStatus = previousOrdersRef.current[order.id];
          const nextStatus = order.status;

          if (previousStatus && previousStatus !== nextStatus) {
            await triggerAlert(order, nextStatus, "remote");
          }
        }
      } else {
        initializedRef.current = true;
      }

      previousOrdersRef.current = nextStatusMap;
      setOrders(data);
      setLastUpdated(new Date());
    },
    [triggerAlert]
  );

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      await processIncomingOrders(data);
    } catch (error) {
      console.error("Error loading orders", error);
    } finally {
      setLoading(false);
    }
  }, [processIncomingOrders]);

  useEffect(() => {
    loadOrders();

    const id = setInterval(() => {
      loadOrders();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [loadOrders]);

  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const districtOptions = useMemo(() => {
    const set = new Set(orders.map((o) => o.district).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text =
        `${order.code} ${order.customerName} ${order.phone} ${order.address} ${order.district}`.toLowerCase();

      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesDistrict =
        districtFilter === "all" || order.district === districtFilter;

      return matchesSearch && matchesDistrict;
    });
  }, [orders, search, districtFilter]);

  const grouped = useMemo(() => {
    return {
      nuevo: filteredOrders.filter((o) => o.status === "nuevo"),
      preparacion: filteredOrders.filter((o) => o.status === "preparacion"),
      listo: filteredOrders.filter((o) => o.status === "listo"),
      entregado: filteredOrders.filter((o) => o.status === "entregado"),
    };
  }, [filteredOrders]);

  const kpis = useMemo(() => {
    const active = orders.filter((o) => o.status !== "entregado");
    const delayed = orders.filter(
      (o) => minutesSince(o.createdAt) >= 20 && o.status !== "entregado"
    );
    const avgTicket = orders.length
      ? orders.reduce((sum, o) => sum + Number(o.total || 0), 0) / orders.length
      : 0;

    return {
      active: active.length,
      delayed: delayed.length,
      totalToday: orders.length,
      avgTicket,
    };
  }, [orders]);

  const handleStatusChange = async (
    orderId: string,
    nextStatus: OrderStatus
  ) => {
    const previous = orders;
    const order = orders.find((o) => o.id === orderId);

    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await updateOrderStatus(orderId, nextStatus);
      setLastUpdated(new Date());

      const updatedOrder =
        previous.find((o) => o.id === orderId) &&
        ({
          ...(previous.find((o) => o.id === orderId) as Order),
          status: nextStatus,
        } as Order);

      if (updatedOrder) {
        previousOrdersRef.current[orderId] = nextStatus;
        await triggerAlert(updatedOrder, nextStatus, "local");
      } else {
        toast.success("Estado del pedido actualizado", {
          description: `${order?.code || "Pedido"} ahora está en "${STATUS_META[nextStatus].label}".`,
        });
      }
    } catch (error) {
      console.error("Error updating order status", error);
      setOrders(previous);

      toast.error("No se pudo actualizar el pedido", {
        description: order?.code
          ? `Se revirtió el cambio para ${order.code}.`
          : "Se revirtió el cambio realizado.",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-8 text-slate-500">
            Cargando pedidos...
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
          value={kpis.active}
          hint="Nuevos + preparación + listos"
          icon={ChefHat}
        />
        <KPI
          title="Pedidos con atención"
          value={kpis.delayed}
          hint="Más de 20 min en proceso"
          icon={AlertCircle}
        />
        <KPI
          title="Pedidos del día"
          value={kpis.totalToday}
          hint="Total visible en la operación"
          icon={Package2}
        />
        <KPI
          title="Ticket promedio"
          value={currency(kpis.avgTicket)}
          hint="Promedio del delivery"
          icon={CheckCircle2}
        />
      </section>

      {!soundEnabled ? (
        <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-amber-900">
                Activa el audio del tablero
              </p>
              <p className="text-sm text-amber-800">
                El navegador necesita una interacción para permitir alarmas
                sonoras.
              </p>
            </div>

            <Button className="rounded-2xl" onClick={enableSound}>
              <Bell className="mr-2 h-4 w-4" />
              Activar alertas sonoras
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_220px_260px_220px_170px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, cliente, teléfono o dirección"
            className="h-12 rounded-2xl"
          />

          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Distrito" />
            </SelectTrigger>
            <SelectContent>
              {districtOptions.map((district) => (
                <SelectItem key={district} value={district}>
                  {district === "all" ? "Todos los distritos" : district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="board" className="rounded-2xl">
                Tablero
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-2xl">
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 px-4 text-sm text-slate-500">
            <span>
              {lastUpdated
                ? `Actualizado: ${lastUpdated.toLocaleTimeString("es-PE")}`
                : "..."}
            </span>
            <RefreshCw className="h-4 w-4" />
          </div>

          <Button
            variant={soundEnabled ? "default" : "outline"}
            className="h-12 rounded-2xl"
            onClick={soundEnabled ? disableSound : enableSound}
          >
            {soundEnabled ? (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Audio activo
              </>
            ) : (
              <>
                <BellOff className="mr-2 h-4 w-4" />
                Audio inactivo
              </>
            )}
          </Button>
        </div>
      </section>

      {viewMode === "board" ? (
        <section className="overflow-x-auto pb-4">
          <div className="flex min-w-[1320px] gap-5">
            <StatusColumn
              title="Nuevos"
              status="nuevo"
              orders={grouped.nuevo}
              onStatusChange={handleStatusChange}
              highlightedOrders={highlightedOrders}
            />
            <StatusColumn
              title="En preparación"
              status="preparacion"
              orders={grouped.preparacion}
              onStatusChange={handleStatusChange}
              highlightedOrders={highlightedOrders}
            />
            <StatusColumn
              title="Listos"
              status="listo"
              orders={grouped.listo}
              onStatusChange={handleStatusChange}
              highlightedOrders={highlightedOrders}
            />
            <StatusColumn
              title="Entregados"
              status="entregado"
              orders={grouped.entregado}
              onStatusChange={handleStatusChange}
              highlightedOrders={highlightedOrders}
            />
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredOrders.length ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                isHighlighted={Boolean(highlightedOrders[order.id])}
                highlightedStatus={highlightedOrders[order.id]}
              />
            ))
          ) : (
            <Card className="rounded-3xl border border-dashed border-slate-200 bg-white">
              <CardContent className="p-12 text-center text-slate-500">
                No hay resultados para los filtros aplicados.
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}