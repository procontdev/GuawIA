import { apiGet, apiPost, USE_MOCK_API } from "@/services/api";
import { mockEventLeads } from "@/services/mock.service";
import type { EventLead, EventLeadStatus } from "@/types/eventLead.types";

export async function fetchEventLeads(): Promise<EventLead[]> {
  if (USE_MOCK_API) {
    return structuredClone(mockEventLeads);
  }

  try {
    return await apiGet<EventLead[]>("/event-leads");
  } catch (error) {
    console.warn("fetchEventLeads fallback to mockEventLeads", error);
    return structuredClone(mockEventLeads);
  }
}

export async function updateEventLeadStatus(
  leadId: string,
  status: EventLeadStatus
) {
  if (USE_MOCK_API) {
    return { ok: true, leadId, status };
  }

  return apiPost("/event-leads/update-status", {
    leadId,
    status,
  });
}