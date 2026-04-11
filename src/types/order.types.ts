export type OrderStatus =
  | "borrador"
  | "por_confirmar"
  | "confirmado"
  | "pendiente_pago"
  | "pagado_por_confirmar"
  | "preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

export interface OrderItemExtra {
  id?: string;
  extraName: string;
  extraUnitPrice?: number;
  subtotal?: number;
  quantity?: number;
}

export interface OrderItem {
  id?: string;
  qty: number;
  name: string;
  extras?: string[];
  unitPrice?: number;
  lineSubtotal?: number;
  notes?: string | null;
  configurationJson?: unknown;
  extraItems?: OrderItemExtra[];
}

export type Order = OrderReceiptInfo & {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  reference?: string;
  notes?: string;
  total: number;
  deliveryType: string;
  deliveryFee: number;
  etaMin?: number | null;
  etaMax?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  preparationStartedAt?: string | null;
  readyAt?: string | null;
  items: OrderItem[];
};

export type OrderListItem = OrderReceiptInfo & {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  deliveryType: string;
  total: number;
  createdAt: string;
  updatedAt?: string | null;
};

export interface OrderCustomerInfo {
  id?: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  channel?: string | null;
}

export type OrderDetail = Order & {
  confirmedAt?: string | null;
  channel?: string | null;
  customerNotes?: string | null;
  internalNotes?: string | null;
  subtotal?: number;
  customer?: {
    id?: string;
    fullName?: string;
    phone?: string;
    email?: string | null;
    channel?: string | null;
  };
};

export type OrderReceiptInfo = {
  hasReceipt?: boolean;
  paymentReceiptId?: string | null;
  receiptId?: string | null;
  receiptUrl?: string | null;
  storagePath?: string | null;
  storageBucket?: string | null;
  storageFileName?: string | null;
  fileName?: string | null;
};