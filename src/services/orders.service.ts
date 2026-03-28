import { apiGet, apiPost, USE_MOCK_API } from "@/services/api";
import { mockOrders } from "@/services/mock.service";
import type { Order, OrderStatus } from "@/types/order.types";

export async function fetchOrders(): Promise<Order[]> {
  if (USE_MOCK_API) {
    return structuredClone(mockOrders);
  }

  try {
    return await apiGet<Order[]>("/orders-board");
  } catch (error) {
    console.warn("fetchOrders fallback to mockOrders", error);
    return structuredClone(mockOrders);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
) {
  if (USE_MOCK_API) {
    return { ok: true, orderId, status };
  }

  return apiPost("/orders/update-status", {
    orderId,
    status,
  });
}