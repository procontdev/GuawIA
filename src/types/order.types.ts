export type OrderStatus = "nuevo" | "preparacion" | "listo" | "entregado";

export interface OrderItem {
  qty: number;
  name: string;
  extras?: string[];
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  customerName?: string;
  phone?: string;
  address?: string;
  district?: string;
  reference?: string;
  notes?: string;
  total?: number | string;
  deliveryFee?: number | string;
  etaMin?: number | null;
  createdAt: string;
  updatedAt?: string | null;

  preparationStartedAt?: string | null;
  readyAt?: string | null;

  items: OrderItem[];
}