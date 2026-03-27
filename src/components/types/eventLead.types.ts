export type EventLeadStatus = "nuevo" | "contactado" | "cotizado" | "cerrado";

export interface EventLead {
  id: number;
  createdAt: string;
  contactName: string;
  phone: string;
  guestCount: number;
  eventDate: string;
  location: string;
  chaufaChoice: string;
  notes: string;
  status: EventLeadStatus;
}