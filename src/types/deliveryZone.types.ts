export interface DeliveryZone {
  id: string;
  zoneName: string;
  district: string;
  referenceKeywords: string[];
  deliveryFee: number;
  etaMin: number | null;
  etaMax: number | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateDeliveryZoneInput = Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDeliveryZoneInput = Partial<CreateDeliveryZoneInput>;
