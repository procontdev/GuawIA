import { apiGet, USE_MOCK_API } from "@/services/api";
import { mockEventLeads, mockOrders } from "@/services/mock.service";
import type { DashboardMetrics } from "@/types/dashboard.types";

function buildMetricsFromMocks(): DashboardMetrics {
  const activeOrders = mockOrders.filter((o) => o.status !== "entregado").length;
  const newOrders = mockOrders.filter((o) => o.status === "nuevo").length;
  const preparingOrders = mockOrders.filter((o) => o.status === "preparacion").length;
  const readyOrders = mockOrders.filter((o) => o.status === "listo").length;
  const deliveredOrders = mockOrders.filter((o) => o.status === "entregado").length;

  const todayOrders = mockOrders.length;
  const totalSalesAmount = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const avgTicket = todayOrders ? totalSalesAmount / todayOrders : 0;

  const eventLeads = mockEventLeads.length;
  const pendingEventLeads = mockEventLeads.filter(
    (lead) =>
      lead.status === "nuevo" ||
      lead.status === "contactado" ||
      lead.status === "cotizado"
  ).length;
  const closedEventLeads = mockEventLeads.filter(
    (lead) => lead.status === "cerrado"
  ).length;

  return {
    activeOrders,
    newOrders,
    preparingOrders,
    readyOrders,
    deliveredOrders,
    todayOrders,
    avgTicket,
    totalSalesAmount,
    eventLeads,
    pendingEventLeads,
    closedEventLeads,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (USE_MOCK_API) {
    return buildMetricsFromMocks();
  }

  try {
    return await apiGet<DashboardMetrics>("/dashboard-summary");
  } catch (error) {
    console.warn("getDashboardMetrics fallback to mocks", error);
    return buildMetricsFromMocks();
  }
}