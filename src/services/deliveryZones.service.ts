import { supabase } from '@/lib/supabase';
import type { 
  DeliveryZone, 
  CreateDeliveryZoneInput, 
  UpdateDeliveryZoneInput 
} from '@/types/deliveryZone.types';

// --- Normalizers ---

function normalizeZone(dbZone: any): DeliveryZone {
  return {
    id: dbZone.id,
    zoneName: dbZone.zone_name,
    district: dbZone.district,
    referenceKeywords: dbZone.reference_keywords || [],
    deliveryFee: Number(dbZone.delivery_fee || 0),
    etaMin: dbZone.eta_min,
    etaMax: dbZone.eta_max,
    isActive: dbZone.is_active,
    isDefault: dbZone.is_default,
    createdAt: dbZone.created_at,
    updatedAt: dbZone.updated_at,
  };
}

function denormalizeZone(zone: CreateDeliveryZoneInput | UpdateDeliveryZoneInput): any {
  const result: any = {};
  
  if (zone.zoneName !== undefined) result.zone_name = zone.zoneName;
  if (zone.district !== undefined) result.district = zone.district;
  if (zone.referenceKeywords !== undefined) result.reference_keywords = zone.referenceKeywords;
  if (zone.deliveryFee !== undefined) result.delivery_fee = zone.deliveryFee;
  if (zone.etaMin !== undefined) result.eta_min = zone.etaMin;
  if (zone.etaMax !== undefined) result.eta_max = zone.etaMax;
  if (zone.isActive !== undefined) result.is_active = zone.isActive;
  if (zone.isDefault !== undefined) result.is_default = zone.isDefault;
  
  return result;
}

// --- Service Methods ---

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('zone_name', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeZone);
}

export async function createDeliveryZone(input: CreateDeliveryZoneInput): Promise<DeliveryZone> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .insert([denormalizeZone(input)])
    .select()
    .single();

  if (error) throw error;
  return normalizeZone(data);
}

export async function updateDeliveryZone(id: string, input: UpdateDeliveryZoneInput): Promise<DeliveryZone> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .update(denormalizeZone(input))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalizeZone(data);
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  const { error } = await supabase
    .from('delivery_zones')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleZoneStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('delivery_zones')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
}
