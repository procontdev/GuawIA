import { apiGet, apiPost, USE_MOCK_API } from "@/services/api";
import { mockOrders } from "@/services/mock.service";
import type {
  Order,
  OrderDetail,
  OrderItem,
  OrderItemExtra,
  OrderListItem,
  OrderStatus,
} from "@/types/order.types";

const SHOW_DUMMY_ORDERS =
  String(import.meta.env.VITE_SHOW_DUMMY_ORDERS) === "true";

type DbOrderStatus =
  | "draft"
  | "pending_confirmation"
  | "confirmed"
  | "pending_payment"
  | "paid_pending_confirmation"
  | "in_kitchen"
  | "dispatched"
  | "delivered"
  | "cancelled";

type ApiOrderExtra = {
  id?: string;
  extraName?: string;
  extra_name?: string;
  name?: string;
  extraUnitPrice?: number | string;
  extra_unit_price?: number | string;
  unitPrice?: number | string;
  unit_price?: number | string;
  subtotal?: number | string;
  quantity?: number | string;
};

type ApiOrderItem = {
  id?: string;
  qty?: number | string;
  quantity?: number | string;
  name?: string;
  itemNameSnapshot?: string;
  item_name_snapshot?: string;
  unitPrice?: number | string;
  unit_price?: number | string;
  lineSubtotal?: number | string;
  line_subtotal?: number | string;
  notes?: string | null;
  configurationJson?: unknown;
  configuration_json?: unknown;
  extras?: string[] | ApiOrderExtra[];
  extraItems?: ApiOrderExtra[];
  extra_items?: ApiOrderExtra[];
};

type ApiCustomer = {
  id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  channel?: string | null;
};

type ApiOrder = {
  id?: string;
  code?: string;
  orderCode?: string;
  order_code?: string;

  status?: string;
  orderStatus?: string;
  order_status?: string;

  customerName?: string;
  customer_name?: string;

  phone?: string;

  address?: string;
  address_text?: string;

  district?: string;

  reference?: string;
  reference_text?: string;

  notes?: string;
  customer_notes?: string;
  internal_notes?: string;

  total?: number | string;
  total_amount?: number | string;
  subtotal?: number | string;

  deliveryType?: string;
  delivery_type?: string;

  deliveryFee?: number | string;
  delivery_fee?: number | string;

  etaMin?: number | null;
  eta_max?: number | null;
  eta_min?: number | null;
  estimated_minutes_min?: number | null;
  estimated_minutes_max?: number | null;

  createdAt?: string;
  created_at?: string;
  requested_at?: string;

  confirmedAt?: string | null;
  confirmed_at?: string | null;

  updatedAt?: string | null;
  updated_at?: string | null;

  preparationStartedAt?: string | null;
  preparation_started_at?: string | null;

  readyAt?: string | null;
  ready_at?: string | null;

  channel?: string | null;

  hasReceipt?: boolean | null;
  has_receipt?: boolean | null;
  paymentReceiptId?: string | null;
  payment_receipt_id?: string | null;
  receiptId?: string | null;
  receipt_id?: string | null;
  receiptUrl?: string | null;
  receipt_url?: string | null;
  receiptFileName?: string | null;
  receipt_file_name?: string | null;
  receiptStoragePath?: string | null;
  receipt_storage_path?: string | null;
  receiptStorageBucket?: string | null;
  receipt_storage_bucket?: string | null;
  storagePath?: string | null;
  storage_path?: string | null;
  storageBucket?: string | null;
  storage_bucket?: string | null;
  storageFileName?: string | null;
  storage_file_name?: string | null;
  fileName?: string | null;
  file_name?: string | null;

  customer?: ApiCustomer;
  items?: ApiOrderItem[];
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isUuid(value?: string) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapDbStatusToUiStatus(status?: string): OrderStatus {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return "borrador";
    case "pending_confirmation":
      return "por_confirmar";
    case "confirmed":
    case "nuevo":
      return "confirmado";
    case "pending_payment":
      return "pendiente_pago";
    case "paid_pending_confirmation":
      return "pagado_por_confirmar";
    case "in_kitchen":
    case "preparacion":
      return "preparacion";
    case "dispatched":
    case "listo":
      return "listo";
    case "delivered":
    case "entregado":
      return "entregado";
    case "cancelled":
      return "cancelado";

    case "borrador":
    case "por_confirmar":
    case "confirmado":
    case "pendiente_pago":
    case "pagado_por_confirmar":
    case "preparacion":
    case "listo":
    case "entregado":
    case "cancelado":
      return status as OrderStatus;

    default:
      return "por_confirmar";
  }
}

function mapUiStatusToDbStatus(status: OrderStatus): DbOrderStatus {
  switch (status) {
    case "borrador":
      return "draft";
    case "por_confirmar":
      return "pending_confirmation";
    case "confirmado":
      return "confirmed";
    case "pendiente_pago":
      return "pending_payment";
    case "pagado_por_confirmar":
      return "paid_pending_confirmation";
    case "preparacion":
      return "in_kitchen";
    case "listo":
      return "dispatched";
    case "entregado":
      return "delivered";
    case "cancelado":
      return "cancelled";
    default:
      return "pending_confirmation";
  }
}

function normalizeExtra(extra: ApiOrderExtra): OrderItemExtra {
  return {
    id: extra.id ? String(extra.id) : undefined,
    extraName: String(extra.extraName ?? extra.extra_name ?? extra.name ?? ""),
    extraUnitPrice: toNumber(
      extra.extraUnitPrice ??
        extra.extra_unit_price ??
        extra.unitPrice ??
        extra.unit_price,
      0
    ),
    subtotal: toNumber(extra.subtotal, 0),
    quantity: toNumber(extra.quantity, 0),
  };
}

function normalizeItem(item: ApiOrderItem): OrderItem {
  const rawExtras = item.extraItems ?? item.extra_items ?? item.extras ?? [];

  const extraItems = Array.isArray(rawExtras)
    ? rawExtras
        .filter((extra) => typeof extra === "object" && extra !== null)
        .map((extra) => normalizeExtra(extra as ApiOrderExtra))
    : [];

  const extras =
    Array.isArray(item.extras) &&
    item.extras.every((extra) => typeof extra === "string")
      ? (item.extras as string[])
      : extraItems.map((extra) => extra.extraName).filter(Boolean);

  return {
    id: item.id ? String(item.id) : undefined,
    qty: toNumber(item.qty ?? item.quantity, 0),
    name: String(
      item.name ?? item.itemNameSnapshot ?? item.item_name_snapshot ?? ""
    ),
    extras,
    unitPrice: toNumber(item.unitPrice ?? item.unit_price, 0),
    lineSubtotal: toNumber(item.lineSubtotal ?? item.line_subtotal, 0),
    notes: item.notes ?? null,
    configurationJson: item.configurationJson ?? item.configuration_json ?? null,
    extraItems,
  };
}

function normalizeOrder(apiOrder: ApiOrder): Order {
  const rawStatus =
    apiOrder.status ?? apiOrder.orderStatus ?? apiOrder.order_status;

  const paymentReceiptId =
    apiOrder.paymentReceiptId ??
    apiOrder.payment_receipt_id ??
    apiOrder.receiptId ??
    apiOrder.receipt_id ??
    null;

  const receiptStoragePath =
    apiOrder.receiptStoragePath ??
    apiOrder.receipt_storage_path ??
    apiOrder.storagePath ??
    apiOrder.storage_path ??
    null;

  const receiptStorageBucket =
    apiOrder.receiptStorageBucket ??
    apiOrder.receipt_storage_bucket ??
    apiOrder.storageBucket ??
    apiOrder.storage_bucket ??
    null;

  const receiptFileName =
    apiOrder.receiptFileName ??
    apiOrder.receipt_file_name ??
    apiOrder.storageFileName ??
    apiOrder.storage_file_name ??
    apiOrder.fileName ??
    apiOrder.file_name ??
    null;

  const receiptUrl =
    apiOrder.receiptUrl ??
    apiOrder.receipt_url ??
    null;

  const hasReceipt =
    Boolean(
      apiOrder.hasReceipt ??
        apiOrder.has_receipt ??
        paymentReceiptId ??
        receiptStoragePath ??
        receiptStorageBucket ??
        receiptFileName ??
        receiptUrl
    );

  return {
    id: String(apiOrder.id ?? ""),
    code: String(
      apiOrder.code ?? apiOrder.orderCode ?? apiOrder.order_code ?? ""
    ),
    status: mapDbStatusToUiStatus(String(rawStatus ?? "")),
    customerName:
      apiOrder.customerName ??
      apiOrder.customer_name ??
      apiOrder.customer?.fullName ??
      apiOrder.customer?.full_name ??
      apiOrder.customer?.name ??
      "",
    phone: apiOrder.phone ?? apiOrder.customer?.phone ?? "",
    address: apiOrder.address ?? apiOrder.address_text ?? "",
    district: apiOrder.district ?? "",
    reference: apiOrder.reference ?? apiOrder.reference_text ?? "",
    notes:
      apiOrder.notes ??
      apiOrder.customer_notes ??
      apiOrder.internal_notes ??
      "",
    total: toNumber(apiOrder.total ?? apiOrder.total_amount, 0),
    deliveryType: String(
      apiOrder.deliveryType ?? apiOrder.delivery_type ?? ""
    ).toLowerCase(),
    deliveryFee: toNumber(apiOrder.deliveryFee ?? apiOrder.delivery_fee, 0),
    etaMin:
      apiOrder.etaMin ??
      apiOrder.eta_min ??
      apiOrder.estimated_minutes_min ??
      null,
    etaMax: apiOrder.estimated_minutes_max ?? apiOrder.eta_max ?? null,
    createdAt: String(
      apiOrder.createdAt ??
        apiOrder.created_at ??
        apiOrder.requested_at ??
        new Date().toISOString()
    ),
    updatedAt: apiOrder.updatedAt ?? apiOrder.updated_at ?? null,
    preparationStartedAt:
      apiOrder.preparationStartedAt ??
      apiOrder.preparation_started_at ??
      null,
    readyAt: apiOrder.readyAt ?? apiOrder.ready_at ?? null,
    items: ensureArray<ApiOrderItem>(apiOrder.items).map(normalizeItem),

    // campos extra para UI de voucher
    hasReceipt,
    paymentReceiptId,
    receiptId: paymentReceiptId,
    receiptUrl,
    storagePath: receiptStoragePath,
    storageBucket: receiptStorageBucket,
    storageFileName: receiptFileName,
    fileName: receiptFileName,
  } as Order;
}

function normalizeOrderListItem(apiOrder: ApiOrder): OrderListItem {
  const order = normalizeOrder(apiOrder) as OrderListItem & {
    hasReceipt?: boolean;
    paymentReceiptId?: string | null;
    receiptId?: string | null;
    receiptUrl?: string | null;
    storagePath?: string | null;
    storageBucket?: string | null;
    storageFileName?: string | null;
    fileName?: string | null;
  };

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    district: order.district,
    deliveryType: order.deliveryType,
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    hasReceipt: order.hasReceipt,
    paymentReceiptId: order.paymentReceiptId,
    receiptId: order.receiptId,
    receiptUrl: order.receiptUrl,
    storagePath: order.storagePath,
    storageBucket: order.storageBucket,
    storageFileName: order.storageFileName,
    fileName: order.fileName,
  } as OrderListItem;
}

function normalizeOrderDetail(apiOrder: ApiOrder): OrderDetail {
  const base = normalizeOrder(apiOrder) as OrderDetail & {
    hasReceipt?: boolean;
    paymentReceiptId?: string | null;
    receiptId?: string | null;
    receiptUrl?: string | null;
    storagePath?: string | null;
    storageBucket?: string | null;
    storageFileName?: string | null;
    fileName?: string | null;
  };

  return {
    ...base,
    confirmedAt: apiOrder.confirmedAt ?? apiOrder.confirmed_at ?? null,
    channel: apiOrder.channel ?? apiOrder.customer?.channel ?? null,
    customerNotes: apiOrder.customer_notes ?? null,
    internalNotes: apiOrder.internal_notes ?? null,
    subtotal: toNumber(apiOrder.subtotal, Number(base.total ?? 0)),
    customer: {
      id: apiOrder.customer?.id ? String(apiOrder.customer.id) : undefined,
      fullName:
        apiOrder.customer?.fullName ??
        apiOrder.customer?.full_name ??
        apiOrder.customer?.name ??
        base.customerName,
      phone: apiOrder.customer?.phone ?? base.phone,
      email: apiOrder.customer?.email ?? null,
      channel: apiOrder.customer?.channel ?? apiOrder.channel ?? null,
    },

    hasReceipt: base.hasReceipt,
    paymentReceiptId: base.paymentReceiptId,
    receiptId: base.receiptId,
    receiptUrl: base.receiptUrl,
    storagePath: base.storagePath,
    storageBucket: base.storageBucket,
    storageFileName: base.storageFileName,
    fileName: base.fileName,
  } as OrderDetail;
}

function buildMockOrderList(): OrderListItem[] {
  return structuredClone(mockOrders)
    .map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      district: order.district,
      deliveryType: order.deliveryType,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt ?? null,
      hasReceipt: false,
      paymentReceiptId: null,
      receiptId: null,
      receiptUrl: null,
      storagePath: null,
      storageBucket: null,
      storageFileName: null,
      fileName: null,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

function buildMockOrderDetail(orderId: string): OrderDetail {
  const found = structuredClone(mockOrders).find((order) => order.id === orderId);

  if (!found) {
    throw new Error(`Order ${orderId} not found in mocks`);
  }

  return {
    ...found,
    confirmedAt: null,
    channel: "telegram",
    customerNotes: found.notes ?? "",
    internalNotes: "",
    subtotal: Number(found.total ?? 0) - Number(found.deliveryFee ?? 0),
    hasReceipt: false,
    paymentReceiptId: null,
    receiptId: null,
    receiptUrl: null,
    storagePath: null,
    storageBucket: null,
    storageFileName: null,
    fileName: null,
    customer: {
      id: found.id,
      fullName: found.customerName,
      phone: found.phone,
      email: null,
      channel: "telegram",
    },
    items: (found.items ?? []).map((item, index) => ({
      ...item,
      id: `${found.id}-${index}`,
      unitPrice: item.unitPrice ?? 0,
      lineSubtotal:
        item.lineSubtotal ??
        toNumber(item.qty, 0) * toNumber(item.unitPrice, 0),
      extraItems:
        item.extraItems ??
        (item.extras ?? []).map((extraName, extraIndex) => ({
          id: `${found.id}-${index}-extra-${extraIndex}`,
          extraName,
          extraUnitPrice: 0,
          subtotal: 0,
          quantity: 1,
        })),
    })),
  };
}

export async function fetchOrders(): Promise<Order[]> {
  if (USE_MOCK_API) {
    return structuredClone(mockOrders);
  }

  try {
    const data = await apiGet<ApiOrder[] | null>("/orders-board");
    const normalized = ensureArray<ApiOrder>(data).map(normalizeOrder);

    if (!normalized.length && SHOW_DUMMY_ORDERS) {
      return structuredClone(mockOrders);
    }

    return normalized;
  } catch (error) {
    console.warn("fetchOrders failed", error);

    if (SHOW_DUMMY_ORDERS) {
      console.warn("fetchOrders fallback to mockOrders because SHOW_DUMMY_ORDERS=true");
      return structuredClone(mockOrders);
    }

    return [];
  }
}

export async function fetchOrdersList(): Promise<OrderListItem[]> {
  if (USE_MOCK_API) {
    return buildMockOrderList();
  }

  const response = await apiGet<ApiOrder[] | null>("/orders-board");
  return ensureArray<ApiOrder>(response)
    .map(normalizeOrderListItem)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function fetchOrderById(orderId: string): Promise<OrderDetail> {
  if (USE_MOCK_API) {
    return buildMockOrderDetail(orderId);
  }

  if (!isUuid(orderId)) {
    throw new Error(`El pedido ${orderId} no tiene un UUID válido`);
  }

  const response = await apiGet<ApiOrder[] | null>("/orders-board");
  const raw = ensureArray<ApiOrder>(response).find(
    (item) => String(item.id) === orderId
  );

  if (!raw) {
    throw new Error(`Order ${orderId} not found`);
  }

  return normalizeOrderDetail(raw);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; orderId: string; status: OrderStatus; order?: Order }> {
  if (USE_MOCK_API) {
    return { ok: true, orderId, status };
  }

  if (!isUuid(orderId)) {
    throw new Error(`No se puede actualizar un pedido sin UUID válido: ${orderId}`);
  }

  const dbStatus = mapUiStatusToDbStatus(status);

  const payload = {
    orderId,
    id: orderId,
    status: dbStatus,
    order_status: dbStatus,
    nextStatus: dbStatus,
    next_status: dbStatus,
  };

  const response = await apiPost<any>("/orders/update-status", payload);

  const rawOrder =
    response?.order ??
    response?.data ??
    response?.item ??
    response?.result ??
    null;

  return {
    ok: response?.ok ?? true,
    orderId: String(
      response?.orderId ?? response?.id ?? response?.order_id ?? orderId
    ),
    status: rawOrder
      ? normalizeOrder(rawOrder).status
      : mapDbStatusToUiStatus(
          String(
            response?.status ??
              response?.order_status ??
              response?.nextStatus ??
              dbStatus
          )
        ),
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
  if (USE_MOCK_API) {
    return { ok: false };
  }

  if (!isUuid(orderId)) {
    throw new Error(`El pedido ${orderId} no tiene un UUID válido`);
  }

  const response = await apiGet<{
    ok?: boolean;
    url?: string;
    paymentReceiptId?: string;
    fileName?: string;
    message?: string;
  }>(`/orders/receipt-link?orderId=${encodeURIComponent(orderId)}`);

  return {
    ok: response?.ok === true,
    url: response?.url,
    paymentReceiptId: response?.paymentReceiptId,
    fileName: response?.fileName,
    message: response?.message,
  };
}

export async function confirmOrderPaymentReview(
  orderId: string,
  paymentReceiptId: string
): Promise<{ ok: boolean; message?: string }> {
  if (USE_MOCK_API) {
    return { ok: true };
  }

  if (!isUuid(orderId)) {
    throw new Error(`El pedido ${orderId} no tiene un UUID válido`);
  }

  if (!isUuid(paymentReceiptId)) {
    throw new Error(`El comprobante ${paymentReceiptId} no tiene un UUID válido`);
  }

  const response = await apiPost<{
    ok?: boolean;
    message?: string;
  }>("/orders/confirm-payment-review", {
    orderId,
    paymentReceiptId,
  });

  return {
    ok: response?.ok !== false,
    message: response?.message,
  };
}

export async function rejectOrderPaymentReview(
  orderId: string,
  paymentReceiptId: string
): Promise<{ ok: boolean; message?: string }> {
  if (USE_MOCK_API) {
    return { ok: true };
  }

  if (!isUuid(orderId)) {
    throw new Error(`El pedido ${orderId} no tiene un UUID válido`);
  }

  if (!isUuid(paymentReceiptId)) {
    throw new Error(`El comprobante ${paymentReceiptId} no tiene un UUID válido`);
  }

  const response = await apiPost<{
    ok?: boolean;
    message?: string;
  }>("/orders/reject-payment-review", {
    orderId,
    paymentReceiptId,
  });

  return {
    ok: response?.ok !== false,
    message: response?.message,
  };
}