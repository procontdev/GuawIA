import { apiGet, apiPost, USE_MOCK_API } from "@/services/api";
import { mockOrders } from "@/services/mock.service";
import type { Order, OrderStatus } from "@/types/order.types";

type ApiOrderItem = {
  qty?: number;
  quantity?: number;
  name?: string;
  extras?: string[];
};

type ApiOrder = {
  id?: string;
  code?: string;
  orderCode?: string;
  order_code?: string;

  status?: OrderStatus;
  orderStatus?: OrderStatus;
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

  deliveryType?: string;
  delivery_type?: string;

  deliveryFee?: number | string;
  delivery_fee?: number | string;

  etaMin?: number | null;
  eta_min?: number | null;
  estimated_minutes_min?: number | null;
  estimated_minutes_max?: number | null;

  createdAt?: string;
  created_at?: string;

  updatedAt?: string | null;
  updated_at?: string | null;

  preparationStartedAt?: string | null;
  preparation_started_at?: string | null;

  readyAt?: string | null;
  ready_at?: string | null;

  items?: ApiOrderItem[];
};

function mapDbStatusToUiStatus(status?: string): OrderStatus {
  switch (status) {
    case "confirmed":
      return "nuevo";
    case "in_kitchen":
      return "preparacion";
    case "dispatched":
      return "listo";
    case "delivered":
      return "entregado";
    case "nuevo":
    case "preparacion":
    case "listo":
    case "entregado":
      return status;
    default:
      return "nuevo";
  }
}

function normalizeOrder(apiOrder: ApiOrder): Order {
  return {
    id: String(apiOrder.id ?? ""),
    code: String(
      apiOrder.code ?? apiOrder.orderCode ?? apiOrder.order_code ?? ""
    ),
    status: mapDbStatusToUiStatus(
      apiOrder.status ?? apiOrder.orderStatus ?? apiOrder.order_status
    ),

    customerName: apiOrder.customerName ?? apiOrder.customer_name ?? "",
    phone: apiOrder.phone ?? "",

    address: apiOrder.address ?? apiOrder.address_text ?? "",
    district: apiOrder.district ?? "",
    reference: apiOrder.reference ?? apiOrder.reference_text ?? "",

    notes:
      apiOrder.notes ??
      apiOrder.customer_notes ??
      apiOrder.internal_notes ??
      "",

    total: Number(apiOrder.total ?? apiOrder.total_amount ?? 0),

    deliveryType:
      (apiOrder.deliveryType ?? apiOrder.delivery_type ?? "").toLowerCase(),

    deliveryFee: Number(apiOrder.deliveryFee ?? apiOrder.delivery_fee ?? 0),

    etaMin:
      apiOrder.etaMin ??
      apiOrder.eta_min ??
      apiOrder.estimated_minutes_min ??
      null,

    createdAt: String(
      apiOrder.createdAt ?? apiOrder.created_at ?? new Date().toISOString()
    ),
    updatedAt: apiOrder.updatedAt ?? apiOrder.updated_at ?? null,

    preparationStartedAt:
      apiOrder.preparationStartedAt ??
      apiOrder.preparation_started_at ??
      null,

    readyAt: apiOrder.readyAt ?? apiOrder.ready_at ?? null,

    items: (apiOrder.items ?? []).map((item) => ({
      qty: Number(item.qty ?? item.quantity ?? 0),
      name: String(item.name ?? ""),
      extras: item.extras ?? [],
    })),
  };
}

export async function fetchOrders(): Promise<Order[]> {
  if (USE_MOCK_API) {
    return structuredClone(mockOrders);
  }

  try {
    const data = await apiGet<ApiOrder[]>("/orders-board");
    return data.map(normalizeOrder);
  } catch (error) {
    console.warn("fetchOrders fallback to mockOrders", error);
    return structuredClone(mockOrders);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; orderId: string; status: OrderStatus; order?: Order }> {
  if (USE_MOCK_API) {
    return { ok: true, orderId, status };
  }

  const response = await apiPost<any>("/orders/update-status", {
    orderId,
    status,
  });

  const rawOrder =
    response?.order ??
    response?.data ??
    response?.item ??
    response?.result ??
    null;

  return {
    ok: response?.ok ?? true,
    orderId: String(response?.orderId ?? response?.id ?? orderId),
    status: rawOrder
      ? normalizeOrder(rawOrder).status
      : mapDbStatusToUiStatus(response?.status),
    order: rawOrder ? normalizeOrder(rawOrder) : undefined,
  };
}