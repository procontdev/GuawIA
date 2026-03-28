export type OrderStatus = "nuevo" | "preparacion" | "listo" | "entregado";

export interface OrderItem {
  name: string;
  qty: number;
  extras: string[];
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  createdAt: string;
  etaMin: number;
  customerName: string;
  phone: string;
  district: string;
  address: string;
  reference: string;
  deliveryFee: number;
  total: number;
  notes: string;
  items: OrderItem[];
}