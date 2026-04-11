import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Package2,
  Phone,
  RefreshCw,
  Store,
  User,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  confirmOrderPaymentReview,
  fetchOrderById,
  fetchOrderReceiptLink,
  rejectOrderPaymentReview,
  updateOrderStatus,
} from "@/services/orders.service";
import type { OrderDetail, OrderStatus } from "@/types/order.types";
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

const STATUS_OPTIONS: OrderStatus[] = [
  "borrador",
  "por_confirmar",
  "confirmado",
  "pendiente_pago",
  "pagado_por_confirmar",
  "preparacion",
  "listo",
  "entregado",
  "cancelado",
];

type OrderReceiptCapable = OrderDetail & {
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

function formatCurrency(value: number | string | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(dateIso?: string | null) {
  if (!dateIso) return "—";

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDeliveryType(value?: string) {
  const normalized = String(value ?? "").toLowerCase();
  return normalized === "pickup" || normalized === "recojo"
    ? "Recojo en tienda"
    : "Delivery";
}

function isUuid(value?: string) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function orderHasReceipt(order?: OrderReceiptCapable | null) {
  if (!order) return false;

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

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedPaymentReceiptId, setSelectedPaymentReceiptId] = useState<string | null>(null);
  const [selectedReceiptFileName, setSelectedReceiptFileName] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setPageError("No se recibió un identificador de pedido.");
      return;
    }

    setPageError("");
    setSaveError("");

    try {
      const data = await fetchOrderById(id);
      setOrder(data);
      setSelectedStatus(
        STATUS_META[data.status as OrderStatus] ? data.status : ""
      );
    } catch (error) {
      console.error("Error loading order detail", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar el detalle del pedido";
      setPageError(message);
      setOrder(null);
      setSelectedStatus("");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const subtotal = useMemo(() => {
    if (order?.subtotal != null) return Number(order.subtotal);
    return Math.max(
      0,
      Number(order?.total ?? 0) - Number(order?.deliveryFee ?? 0)
    );
  }, [order]);

  const closeReceiptModal = useCallback(() => {
    if (reviewSubmitting) return;

    setReceiptModalOpen(false);
    setSelectedReceiptUrl(null);
    setSelectedPaymentReceiptId(null);
    setSelectedReceiptFileName(null);
  }, [reviewSubmitting]);

  const handleOpenReceipt = useCallback(async () => {
    if (!order) return;

    try {
      setReceiptLoading(true);

      const result = await fetchOrderReceiptLink(order.id);

      if (!result.ok || !result.url || !result.paymentReceiptId) {
        throw new Error(result.message || "No se encontró el comprobante");
      }

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
  }, [order]);

  const handleDownloadReceipt = useCallback(() => {
    if (!selectedReceiptUrl) return;
    window.open(selectedReceiptUrl, "_blank", "noopener,noreferrer");
  }, [selectedReceiptUrl]);

  const handleConfirmPayment = useCallback(async () => {
    if (!order || !selectedPaymentReceiptId) return;

    try {
      setReviewSubmitting(true);

      const result = await confirmOrderPaymentReview(
        order.id,
        selectedPaymentReceiptId
      );

      if (!result.ok) {
        throw new Error(result.message || "No se pudo confirmar el pago");
      }

      toast.success("Pago confirmado");
      closeReceiptModal();
      await loadOrder();
    } catch (error) {
      console.error("Error confirming payment review", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo confirmar el pago"
      );
    } finally {
      setReviewSubmitting(false);
    }
  }, [closeReceiptModal, loadOrder, order, selectedPaymentReceiptId]);

  const handleRejectPayment = useCallback(async () => {
    if (!order || !selectedPaymentReceiptId) return;

    try {
      setReviewSubmitting(true);

      const result = await rejectOrderPaymentReview(
        order.id,
        selectedPaymentReceiptId
      );

      if (!result.ok) {
        throw new Error(result.message || "No se pudo rechazar el pago");
      }

      toast.success("Pago rechazado");
      closeReceiptModal();
      await loadOrder();
    } catch (error) {
      console.error("Error rejecting payment review", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo rechazar el pago"
      );
    } finally {
      setReviewSubmitting(false);
    }
  }, [closeReceiptModal, loadOrder, order, selectedPaymentReceiptId]);

  const handleSaveStatus = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) return;

    setSaveError("");

    if (!isUuid(order.id)) {
      const message =
        "Este pedido no tiene un UUID real. No se puede actualizar en n8n/Postgres.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    const previousStatus = order.status;
    setSaving(true);

    try {
      const result = await updateOrderStatus(order.id, selectedStatus);

      setOrder((current) =>
        current
          ? {
              ...current,
              status: result.order?.status ?? selectedStatus,
            }
          : current
      );

      toast.success("Estado actualizado", {
        description: `${order.code || "Pedido"} ahora está en "${getStatusLabel(
          result.order?.status ?? selectedStatus
        )}".`,
      });
    } catch (error) {
      console.error("Error updating order status", error);
      setSelectedStatus(
        STATUS_META[previousStatus as OrderStatus] ? previousStatus : ""
      );

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado";

      setSaveError(message);
      toast.error("No se pudo actualizar el estado", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-8 text-slate-500">
          Cargando detalle del pedido...
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="space-y-4 p-8">
          <p className="text-slate-500">
            {pageError || "No se encontró el pedido solicitado."}
          </p>
          <Button variant="outline" onClick={() => navigate("/orders")}>
            Volver a pedidos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPickup =
    order.deliveryType === "pickup" || order.deliveryType === "recojo";
  const canViewReceipt = orderHasReceipt(order as OrderReceiptCapable);

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => navigate("/orders")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {order.code || order.id}
                </h3>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Pedido registrado el {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <Button variant="outline" className="rounded-2xl" onClick={loadOrder}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recargar
          </Button>
        </section>

        {saveError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {saveError}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Fecha y hora
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Tipo
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatDeliveryType(order.deliveryType)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Canal
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {order.channel || order.customer?.channel || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    ETA
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {order.etaMin ? `${order.etaMin} min` : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Cliente y entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="h-4 w-4" />
                      <span className="text-sm">Cliente</span>
                    </div>
                    <p className="mt-2 font-medium text-slate-900">
                      {order.customer?.fullName ||
                        order.customerName ||
                        "Sin nombre"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">Teléfono</span>
                    </div>
                    <p className="mt-2 font-medium text-slate-900">
                      {order.customer?.phone || order.phone || "Sin teléfono"}
                    </p>
                  </div>
                </div>

                {isPickup ? (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Store className="h-4 w-4" />
                      <span className="text-sm">Entrega</span>
                    </div>
                    <p className="mt-2 font-medium text-slate-900">
                      Recojo en tienda
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Dirección de entrega</span>
                    </div>
                    <p className="mt-2 font-medium text-slate-900">
                      {order.address || "Sin dirección"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.district || "Sin distrito"}
                      {order.reference ? ` · ${order.reference}` : ""}
                    </p>
                  </div>
                )}

                {order.customerNotes ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">
                      Nota del cliente
                    </p>
                    <p className="mt-1 text-sm text-amber-900">
                      {order.customerNotes}
                    </p>
                  </div>
                ) : null}

                {order.internalNotes ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Nota interna
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {order.internalNotes}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Ítems del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.length ? (
                  order.items.map((item, index) => (
                    <div
                      key={item.id ?? `${order.id}-${index}`}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.qty} x {item.name}
                          </p>

                          {item.notes ? (
                            <p className="mt-1 text-sm text-slate-500">
                              Nota: {item.notes}
                            </p>
                          ) : null}

                          {item.extras?.length ? (
                            <p className="mt-1 text-sm text-slate-500">
                              Extras: {item.extras.join(", ")}
                            </p>
                          ) : null}

                          {item.extraItems?.length ? (
                            <div className="mt-3 space-y-2">
                              {item.extraItems.map((extra, extraIndex) => (
                                <div
                                  key={
                                    extra.id ??
                                    `${order.id}-${index}-extra-${extraIndex}`
                                  }
                                  className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                >
                                  {extra.quantity ?? 1} x {extra.extraName}
                                  {(extra.subtotal ?? 0) > 0 ? (
                                    <span className="ml-2 text-slate-500">
                                      ({formatCurrency(extra.subtotal)})
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">Subtotal</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(item.lineSubtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                    Sin detalle de ítems.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {canViewReceipt ? (
              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Comprobante de pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Este pedido tiene un voucher asociado. Puedes abrirlo para revisarlo.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl"
                    onClick={handleOpenReceipt}
                  >
                    Mostrar voucher
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Actualizar estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
                >
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="h-12 w-full rounded-2xl"
                  onClick={handleSaveStatus}
                  disabled={saving || !selectedStatus || selectedStatus === order.status}
                >
                  {saving ? "Guardando..." : "Guardar estado"}
                </Button>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Estado actual:{" "}
                  <span className="font-medium text-slate-900">
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {!isUuid(order.id) ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Este pedido no tiene UUID real y no puede actualizarse contra
                    n8n/Postgres.
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Totales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">Total</span>
                    <span className="text-xl font-semibold text-slate-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Tiempos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Creado</p>
                    <p className="text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Package2 className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Confirmado</p>
                    <p className="text-slate-500">
                      {formatDate(order.confirmedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <PaymentReceiptReviewModal
        open={receiptModalOpen}
        title="Revisión de comprobante"
        orderCode={order.code || order.id}
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