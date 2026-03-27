import type { EventLead } from "./eventLead.types";
import type { Order } from "./order.types";

export interface DashboardMetrics {
  activeOrders: number;
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveredOrders: number;
  todayOrders: number;
  totalSalesAmount: number;
  eventLeads: number;
  pendingEventLeads: number;
}

export interface DashboardActivityItem {
  id: string;
  type: "order" | "lead";
  title: string;
  description: string;
  createdAt: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentOrders: Order[];
  recentLeads: EventLead[];
  activity: DashboardActivityItem[];
}