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

export type DbOrderStatus =
  | "draft"
  | "pending_confirmation"
  | "confirmed"
  | "pending_payment"
  | "paid_pending_confirmation"
  | "preparing"
  | "ready"
  | "delivered"
  | "canceled";

export interface OrderItemExtra {
  id?: string;
  extraName: string;
  extraUnitPrice?: number;
  subtotal?: number;
  quantity?: number;
}

export interface OrderItem {
  id: string;
  qty: number;
  name: string;
  extras?: string[]; // Legacy compatibility
  unitPrice: number;
  lineSubtotal: number;
  notes?: string | null;
  configurationJson?: any;
  extraItems?: OrderItemExtra[];
  itemId?: string;
  itemNameSnapshot: string;
}

export interface PaymentReceipt {
  id: string;
  orderId: string;
  customerId?: string;
  channel: string;
  storageUrl?: string;
  storagePath?: string;
  storageBucket?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;

  // IA Fields
  aiDocumentType?: string;
  aiIsPaymentReceipt?: boolean;
  aiConfidence?: number;
  aiDetectedAmount?: number;
  aiCurrency?: string;
  aiOperationCode?: string;
  aiIssuer?: string;
  aiDetectedDateText?: string;
  aiNotes?: string;
  aiRawJson?: any;

  // Validation & Review
  expectedAmount?: number;
  amountMatchesOrder?: boolean;
  validationDecision: string;
  manualReviewStatus: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export type Order = {
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
  subtotal?: number;
  deliveryType: string;
  deliveryFee: number;
  etaMin?: number | null;
  etaMax?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  requestedAt?: string | null;
  confirmedAt?: string | null;
  preparationStartedAt?: string | null;
  readyAt?: string | null;
  items: OrderItem[];

  // Delivery tracking info
  deliveryZoneId?: string | null;
  coverageStatus?:
    | "covered"
    | "out_of_coverage"
    | "insufficient_data"
    | "unknown";
  deliveryConfidence?: number;
  deliveryResolutionMethod?: string;
  deliveryResolutionDetail?: any;

  // Payment status info
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReceiptReceivedAt?: string | null;
  paymentReviewedAt?: string | null;
  paymentReviewNotes?: string | null;

  // Link to receipts
  receipts?: PaymentReceipt[];

  // UI Compatibility fields (Mapping legacy names)
  hasReceipt?: boolean;
  paymentReceiptId?: string | null;
  receiptId?: string | null;
  receiptUrl?: string | null;
  storagePath?: string | null;
  storageBucket?: string | null;
  storageFileName?: string | null;
};

export type OrderListItem = Pick<
  Order,
  | "id"
  | "code"
  | "status"
  | "customerName"
  | "phone"
  | "address"
  | "district"
  | "deliveryType"
  | "total"
  | "createdAt"
  | "updatedAt"
  | "hasReceipt"
  | "paymentReceiptId"
  | "receiptUrl"
>;

export interface OrderCustomerInfo {
  id?: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  channel?: string | null;
}

export type OrderDetail = Order & {
  channel?: string | null;
  customerNotes?: string | null;
  internalNotes?: string | null;
  customer?: OrderCustomerInfo;
};