import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Clock3,
  MapPin,
  Package2,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  confirmOrderPaymentReview,
  fetchOrderReceiptLink,
  fetchOrdersList,
  rejectOrderPaymentReview,
} from "@/services/orders.service";
import type { OrderListItem, OrderStatus } from "@/types/order.types";
import PaymentReceiptReviewModal from "@/components/orders/PaymentReceiptReviewModal";

const STATUS_META: Record<OrderStatus, { label: string }> = {
  borrador: { label: "Borrador" },
  por_confirmar: { label: "Por confirmar" },
  confirmado: { label: "Confirmado" },
  pendiente_pago: { label: "Pendiente de pago" },
  pagado_por_confirmar: { label: "Pagado por confirmar" },
  preparacion: { label: "En preparación" },
  listo: { label: "Listo" },
  entregado: { label: "Entregado" },
  cancelado: { label: "Cancelado" },
};

type OrderReceiptCapable = OrderListItem & {
  hasReceipt?: boolean | null;
  paymentReceiptId?: string | null;
  receiptId?: string | null;
  receiptUrl?: string | null;
  storagePath?: string | null;
  storageBucket?: string | null;
  storageFileName?: string | null;
  fileName?: string | null;
};

function getStatusLabel(status?: string) {
  if (!status) return "Sin estado";
  return STATUS_META[status as OrderStatus]?.label ?? status;
}

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);

  return {
    date: date.toLocaleDateString("es-PE"),
    time: date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatCurrency(value: number | string | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDeliveryType(value?: string) {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized === "pickup" || normalized === "recojo") {
    return "Recojo en tienda";
  }

  return "Delivery";
}

function isPickupType(value?: string) {
  const normalized = String(value ?? "").toLowerCase();
  return normalized === "pickup" || normalized === "recojo";
}

function orderHasReceipt(order: OrderReceiptCapable) {
  return Boolean(
    order.hasReceipt ||
      order.paymentReceiptId ||
      order.receiptId ||
      order.receiptUrl ||
      order.storagePath ||
      order.storageBucket ||
      order.storageFileName ||
      order.fileName
  );
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
      {getStatusLabel(status)}
    </Badge>
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfDay(dateString: string) {
  return new Date(`${dateString}T00:00:00`);
}

function getEndOfDay(dateString: string) {
  return new Date(`${dateString}T23:59:59.999`);
}

export default function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null
  );
  const [selectedReceiptOrderId, setSelectedReceiptOrderId] = useState<
    string | null
  >(null);
  const [selectedReceiptOrderCode, setSelectedReceiptOrderCode] = useState<
    string | null
  >(null);
  const [selectedPaymentReceiptId, setSelectedPaymentReceiptId] = useState<
    string | null
  >(null);
  const [selectedReceiptFileName, setSelectedReceiptFileName] = useState<
    string | null
  >(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoadError("");

    try {
      const data = await fetchOrdersList();
      setOrders(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading orders list", error);
      setOrders([]);
      setLoadError(
        error instanceof Error ? error.message : "No se pudo cargar pedidos"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const closeReceiptModal = useCallback(() => {
    if (reviewSubmitting) return;

    setReceiptModalOpen(false);
    setSelectedReceiptUrl(null);
    setSelectedReceiptOrderId(null);
    setSelectedReceiptOrderCode(null);
    setSelectedPaymentReceiptId(null);
    setSelectedReceiptFileName(null);
  }, [reviewSubmitting]);

  const handleOpenReceiptModal = useCallback(async (order: OrderListItem) => {
    try {
      setReceiptLoading(true);

      const result = await fetchOrderReceiptLink(order.id);

      if (!result.ok || !result.url || !result.paymentReceiptId) {
        throw new Error(result.message || "No se encontró el comprobante");
      }

      setSelectedReceiptOrderId(order.id);
      setSelectedReceiptOrderCode(order.code || order.id);
      setSelectedReceiptUrl(result.url);
      setSelectedPaymentReceiptId(result.paymentReceiptId);
      setSelectedReceiptFileName(result.fileName ?? null);
      setReceiptModalOpen(true);
    } catch (error) {
      console.error("Error opening order receipt", error);
      toast.error("No se pudo abrir el comprobante");
    } finally {
      setReceiptLoading(false);
    }
  }, []);

  const handleDownloadReceipt = useCallback(() => {
    if (!selectedReceiptUrl) return;
    window.open(selectedReceiptUrl, "_blank", "noopener,noreferrer");
  }, [selectedReceiptUrl]);

  const handleConfirmPayment = useCallback(async () => {
    if (!selectedReceiptOrderId || !selectedPaymentReceiptId) return;

    try {
      setReviewSubmitting(true);

      const result = await confirmOrderPaymentReview(
        selectedReceiptOrderId,
        selectedPaymentReceiptId
      );

      if (!result.ok) {
        throw new Error(result.message || "No se pudo confirmar el pago");
      }

      toast.success("Pago confirmado");
      closeReceiptModal();
      await loadOrders();
    } catch (error) {
      console.error("Error confirming payment review", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo confirmar el pago"
      );
    } finally {
      setReviewSubmitting(false);
    }
  }, [
    closeReceiptModal,
    loadOrders,
    selectedPaymentReceiptId,
    selectedReceiptOrderId,
  ]);

  const handleRejectPayment = useCallback(async () => {
    if (!selectedReceiptOrderId || !selectedPaymentReceiptId) return;

    try {
      setReviewSubmitting(true);

      const result = await rejectOrderPaymentReview(
        selectedReceiptOrderId,
        selectedPaymentReceiptId
      );

      if (!result.ok) {
        throw new Error(result.message || "No se pudo rechazar el pago");
      }

      toast.success("Pago rechazado");
      closeReceiptModal();
      await loadOrders();
    } catch (error) {
      console.error("Error rejecting payment review", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo rechazar el pago"
      );
    } finally {
      setReviewSubmitting(false);
    }
  }, [
    closeReceiptModal,
    loadOrders,
    selectedPaymentReceiptId,
    selectedReceiptOrderId,
  ]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const haystack = [
        order.code,
        order.customerName,
        order.phone,
        order.address,
        order.district,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || haystack.includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "all" || String(order.status ?? "") === statusFilter;

      const normalizedType = String(order.deliveryType ?? "").toLowerCase();
      const matchesType =
        typeFilter === "all" ||
        normalizedType === typeFilter ||
        (typeFilter === "pickup" && normalizedType === "recojo");

      const orderDate = new Date(order.createdAt);
      const matchesDateFrom = !dateFrom || orderDate >= getStartOfDay(dateFrom);
      const matchesDateTo = !dateTo || orderDate <= getEndOfDay(dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [orders, search, statusFilter, typeFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const setTodayFilter = () => {
    const today = toDateInputValue(new Date());
    setDateFrom(today);
    setDateTo(today);
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-8 text-slate-500">
          Cargando pedidos...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_220px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por pedido, cliente, teléfono o dirección"
                className="h-12 rounded-2xl pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="por_confirmar">Por confirmar</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendiente_pago">Pendiente de pago</SelectItem>
                <SelectItem value="pagado_por_confirmar">
                  Pagado por confirmar
                </SelectItem>
                <SelectItem value="preparacion">En preparación</SelectItem>
                <SelectItem value="listo">Listo</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Recojo en tienda</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="h-12 rounded-2xl"
              variant="outline"
              onClick={loadOrders}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-[220px_220px_160px_160px]">
            <div>
              <label className="mb-1 block text-sm text-slate-500">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-500">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-6 h-12 rounded-2xl"
              onClick={setTodayFilter}
            >
              Hoy
            </Button>

            <Button
              type="button"
              variant="outline"
              className="mt-6 h-12 rounded-2xl"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <span>{filteredOrders.length} pedido(s) visibles</span>
            <span>
              {lastUpdated
                ? `Actualizado: ${lastUpdated.toLocaleTimeString("es-PE")}`
                : "Sin actualizar"}
            </span>
          </div>

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadError}
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          {filteredOrders.map((order) => {
            const { date, time } = formatDateTime(order.createdAt);
            const isPickup = isPickupType(order.deliveryType);
            const canViewReceipt = orderHasReceipt(order as OrderReceiptCapable);

            return (
              <Card
                key={order.id}
                className="cursor-pointer rounded-3xl border-slate-200 shadow-sm transition hover:border-slate-300"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">
                          {order.code || order.id}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{order.customerName || "Sin nombre"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Package2 className="h-4 w-4" />
                          <span>{formatDeliveryType(order.deliveryType)}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4" />
                          <span>
                            {isPickup
                              ? "Recojo en tienda"
                              : order.address || "Sin dirección"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-500 lg:min-w-[220px] lg:text-right">
                      <div>
                        <div className="font-medium text-slate-700">{date}</div>
                        <div>{time}</div>
                      </div>

                      <div className="flex items-center gap-2 lg:justify-end">
                        <Clock3 className="h-4 w-4" />
                        <span>{formatCurrency(order.total)}</span>
                      </div>

                      {canViewReceipt ? (
                        <div className="pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await handleOpenReceiptModal(order);
                            }}
                          >
                            Ver voucher
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!filteredOrders.length ? (
            <Card className="rounded-3xl border border-dashed border-slate-200 bg-white">
              <CardContent className="p-12 text-center text-slate-500">
                No hay pedidos para los filtros aplicados.
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>

      <PaymentReceiptReviewModal
        open={receiptModalOpen}
        title="Revisión de comprobante"
        orderCode={selectedReceiptOrderCode ?? undefined}
        receiptUrl={selectedReceiptUrl}
        fileName={selectedReceiptFileName}
        loading={receiptLoading}
        submitting={reviewSubmitting}
        onClose={closeReceiptModal}
        onDownload={handleDownloadReceipt}
        onConfirm={handleConfirmPayment}
        onReject={handleRejectPayment}
      />
    </>
  );
}