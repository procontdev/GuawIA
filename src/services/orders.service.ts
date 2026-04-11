import { apiGet, apiPost, USE_MOCK_API } from "@/services/api";
import { mockOrders } from "@/services/mock.service";
import type {
  Order,
  OrderDetail,
  OrderItem,
  OrderStatus,
  PaymentReceipt
} from "@/types/order.types";

// --- Types for Data Normalization ---

type ApiOrderExtra = {
  id?: string;
  extra_name?: string;
  extra_unit_price?: number | string;
  quantity?: number | string;
  subtotal?: number | string;
};

type ApiOrderItem = {
  id?: string;
  qty?: number | string;
  quantity?: number | string;
  item_name_snapshot?: string;
  unit_price?: number | string;
  line_subtotal?: number | string;
  notes?: string | null;
  configuration_json?: any;
  extra_items?: ApiOrderExtra[];
};

type ApiPaymentReceipt = {
  id: string;
  ai_document_type?: string;
  ai_is_payment_receipt?: boolean;
  ai_confidence?: number | string;
  ai_detected_amount?: number | string;
  ai_currency?: string;
  ai_operation_code?: string;
  ai_issuer?: string;
  ai_detected_date_text?: string;
  ai_notes?: string;
  validation_decision?: string;
  manual_review_status?: string;
  storage_url?: string;
  storage_path?: string;
  storage_bucket?: string;
  storage_file_name?: string;
  created_at?: string;
  updated_at?: string;
};

type ApiOrder = {
  id?: string;
  code?: string;
  order_status?: string;
  customer_name?: string;
  phone?: string;
  address_text?: string;
  district?: string;
  reference_text?: string;
  customer_notes?: string;
  internal_notes?: string;
  total_amount?: number | string;
  subtotal?: number | string;
  delivery_type?: string;
  delivery_fee?: number | string;
  estimated_minutes_min?: number | string;
  estimated_minutes_max?: number | string;
  requested_at?: string;
  confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
  preparation_started_at?: string;
  ready_at?: string;
  items?: ApiOrderItem[];
  payment_status?: string;
  payment_method?: string;
  payment_receipt_received_at?: string;
  receipts?: ApiPaymentReceipt[];

  // Delivery resolution fields
  delivery_zone_id?: string;
  coverage_status?: string;
  delivery_confidence?: number | string;
  delivery_resolution_method?: string;
  delivery_resolution_detail?: any;

  // Legacy mappings for mocks and older versions
  status?: string;
  customerName?: string;
  address?: string;
  deliveryType?: string;
  deliveryFee?: number | string;
  total?: number | string;
  createdAt?: string;
};

// --- Helper Functions ---

function toNumber(value: any, defaultValue: number): number;
function toNumber(value: any, defaultValue: null): number | null;
function toNumber(value: any, defaultValue: any): any {
  if (value === null || value === undefined || value === "") return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function ensureArray<T>(value: any): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// --- Status Mapping ---

export function mapDbStatusToUiStatus(dbStatus: string): OrderStatus {
  const normalized = dbStatus?.toLowerCase();
  switch (normalized) {
    case "draft":
    case "borrador":
      return "borrador";
    case "pending_confirmation":
    case "por_confirmar":
      return "por_confirmar";
    case "confirmed":
    case "confirmado":
      return "confirmado";
    case "pending_payment":
    case "pendiente_pago":
      return "pendiente_pago";
    case "paid_pending_confirmation":
    case "pagado_por_confirmar":
      return "pagado_por_confirmar";
    case "preparing":
    case "preparacion":
    case "in_kitchen":
      return "preparacion";
    case "ready":
    case "listo":
    case "dispatched":
      return "listo";
    case "delivered":
    case "entregado":
      return "entregado";
    case "canceled":
    case "cancelled":
    case "cancelado":
      return "cancelado";
    default:
      return "borrador";
  }
}

export function mapUiStatusToDbStatus(uiStatus: OrderStatus): string {
  switch (uiStatus) {
    case "borrador": return "draft";
    case "por_confirmar": return "pending_confirmation";
    case "confirmado": return "confirmed";
    case "pendiente_pago": return "pending_payment";
    case "pagado_por_confirmar": return "paid_pending_confirmation";
    case "preparacion": return "preparing";
    case "listo": return "ready";
    case "entregado": return "delivered";
    case "cancelado": return "canceled";
    default: return "draft";
  }
}

// --- Normalization Functions ---

function normalizeReceipt(apiReceipt: ApiPaymentReceipt): PaymentReceipt {
  return {
    id: apiReceipt.id,
    orderId: "", 
    channel: "telegram",
    storageUrl: apiReceipt.storage_url,
    storagePath: apiReceipt.storage_path,
    storageBucket: apiReceipt.storage_bucket,
    fileName: apiReceipt.storage_file_name,
    aiDocumentType: apiReceipt.ai_document_type,
    aiIsPaymentReceipt: apiReceipt.ai_is_payment_receipt,
    aiConfidence: toNumber(apiReceipt.ai_confidence, 0),
    aiDetectedAmount: toNumber(apiReceipt.ai_detected_amount, 0),
    aiCurrency: apiReceipt.ai_currency,
    aiOperationCode: apiReceipt.ai_operation_code,
    aiIssuer: apiReceipt.ai_issuer,
    aiDetectedDateText: apiReceipt.ai_detected_date_text,
    aiNotes: apiReceipt.ai_notes,
    validationDecision: apiReceipt.validation_decision ?? "pending_analysis",
    manualReviewStatus: apiReceipt.manual_review_status ?? "pending_review",
    createdAt: apiReceipt.created_at ?? new Date().toISOString(),
    updatedAt: apiReceipt.updated_at ?? new Date().toISOString(),
  };
}

function normalizeItem(apiItem: ApiOrderItem): OrderItem {
  return {
    id: String(apiItem.id ?? ""),
    qty: toNumber(apiItem.qty ?? apiItem.quantity, 1),
    name: apiItem.item_name_snapshot ?? "Item",
    itemNameSnapshot: apiItem.item_name_snapshot ?? "Item",
    unitPrice: toNumber(apiItem.unit_price, 0),
    lineSubtotal: toNumber(apiItem.line_subtotal, 0),
    notes: apiItem.notes,
    configurationJson: apiItem.configuration_json,
    extraItems: ensureArray<ApiOrderExtra>(apiItem.extra_items).map((e) => ({
      id: e.id,
      extraName: e.extra_name ?? "Extra",
      extraUnitPrice: toNumber(e.extra_unit_price, 0),
      quantity: toNumber(e.quantity, 1),
      subtotal: toNumber(e.subtotal, 0),
    })),
  };
}

export function normalizeOrder(apiOrder: ApiOrder): Order {
  const receipts = ensureArray<ApiPaymentReceipt>(apiOrder.receipts).map(
    normalizeReceipt
  );
  const mainReceipt = receipts[0];

  return {
    id: String(apiOrder.id ?? ""),
    code: String(apiOrder.code ?? ""),
    status: mapDbStatusToUiStatus(
      String(apiOrder.order_status ?? apiOrder.status ?? "draft")
    ),
    customerName: apiOrder.customer_name ?? apiOrder.customerName ?? "Cliente",
    phone: apiOrder.phone ?? "",
    address: apiOrder.address_text ?? apiOrder.address ?? "",
    district: apiOrder.district ?? "",
    reference: apiOrder.reference_text ?? "",
    notes: apiOrder.customer_notes ?? apiOrder.internal_notes ?? "",
    total: toNumber(apiOrder.total_amount ?? apiOrder.total, 0),
    subtotal: toNumber(apiOrder.subtotal, 0),
    deliveryType: String(
      apiOrder.delivery_type ?? apiOrder.deliveryType ?? "delivery"
    ).toLowerCase(),
    deliveryFee: toNumber(apiOrder.delivery_fee ?? apiOrder.deliveryFee, 0),
    etaMin: toNumber(apiOrder.estimated_minutes_min, null),
    etaMax: toNumber(apiOrder.estimated_minutes_max, null),
    createdAt:
      apiOrder.created_at ??
      apiOrder.createdAt ??
      apiOrder.requested_at ??
      new Date().toISOString(),
    updatedAt: apiOrder.updated_at ?? null,
    requestedAt: apiOrder.requested_at ?? null,
    confirmedAt: apiOrder.confirmed_at ?? null,
    preparationStartedAt: apiOrder.preparation_started_at ?? null,
    readyAt: apiOrder.ready_at ?? null,
    items: ensureArray<ApiOrderItem>(apiOrder.items).map(normalizeItem),

    // Payment Info
    paymentStatus: apiOrder.payment_status,
    paymentMethod: apiOrder.payment_method,
    paymentReceiptReceivedAt: apiOrder.payment_receipt_received_at,
    receipts,

    // Delivery Resolution Info
    deliveryZoneId: apiOrder.delivery_zone_id,
    coverageStatus: apiOrder.coverage_status as any,
    deliveryConfidence: toNumber(apiOrder.delivery_confidence, 0),
    deliveryResolutionMethod: apiOrder.delivery_resolution_method,
    deliveryResolutionDetail: apiOrder.delivery_resolution_detail,

    // UI Legacy Compatibility
    hasReceipt: receipts.length > 0,
    paymentReceiptId: mainReceipt?.id ?? null,
    receiptId: mainReceipt?.id ?? null,
    receiptUrl: mainReceipt?.storageUrl ?? null,
    storagePath: mainReceipt?.storagePath ?? null,
    storageBucket: mainReceipt?.storageBucket ?? null,
    storageFileName: mainReceipt?.fileName ?? null,
  };
}

// --- API Functions ---

export async function fetchOrders(): Promise<Order[]> {
  if (USE_MOCK_API) {
    return mockOrders;
  }

  const response = await apiGet<any>("/orders-board");
  const rawOrders = ensureArray<ApiOrder>(
    response?.orders ?? response?.data ?? response?.items ?? response
  );

  return rawOrders.map(normalizeOrder);
}

// Aliases for backward compatibility
export const fetchOrdersList = fetchOrders;

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  if (USE_MOCK_API) {
    const raw = mockOrders.find((ov) => ov.id === orderId);
    if (!raw) throw new Error(`Order ${orderId} not found`);
    return raw as OrderDetail;
  }

  const response = await apiGet<any>(`/orders/detail?id=${orderId}`);
  const raw = response?.order ?? response?.data ?? response?.[0] ?? response;

  if (!raw) throw new Error(`No data for order ${orderId}`);
  return normalizeOrder(raw) as OrderDetail;
}

// Alias for backward compatibility
export const fetchOrderById = fetchOrderDetail;

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; orderId: string; status: OrderStatus; order?: Order }> {
  if (USE_MOCK_API) {
    return { ok: true, orderId, status };
  }

  const dbStatus = mapUiStatusToDbStatus(status);
  const response = await apiPost<any>("/orders/update-status", {
    orderId,
    status: dbStatus,
  });

  const rawOrder = response?.order ?? response?.data ?? null;

  return {
    ok: response?.ok ?? true,
    orderId,
    status: rawOrder ? normalizeOrder(rawOrder).status : status,
    order: rawOrder ? normalizeOrder(rawOrder) : undefined,
  };
}

export async function fetchOrderReceiptLink(orderId: string): Promise<{
    ok: boolean;
    url?: string;
    paymentReceiptId?: string;
    fileName?: string;
    message?: string;
}> {
  if (USE_MOCK_API) return { ok: false };

  const response = await apiGet<any>(`/orders/receipt-link?orderId=${orderId}`);
  return {
    ok: response?.ok === true,
    url: response?.url,
    paymentReceiptId: response?.paymentReceiptId,
    fileName: response?.fileName,
    message: response?.message || response?.error,
  };
}

export async function confirmOrderPaymentReview(orderId: string, paymentReceiptId: string): Promise<{ ok: boolean; message?: string }> {
  if (USE_MOCK_API) return { ok: true };
  const response = await apiPost<any>("/orders/confirm-payment-review", { orderId, paymentReceiptId });
  return { ok: response?.ok !== false, message: response?.message || response?.error };
}

export async function rejectOrderPaymentReview(orderId: string, paymentReceiptId: string): Promise<{ ok: boolean; message?: string }> {
  if (USE_MOCK_API) return { ok: true };
  const response = await apiPost<any>("/orders/reject-payment-review", { orderId, paymentReceiptId });
  return { ok: response?.ok !== false, message: response?.message || response?.error };
}