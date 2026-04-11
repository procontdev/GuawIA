import { USE_MOCK_API } from "@/services/api";

export function getEnvironmentLabel() {
  if (USE_MOCK_API) return "Modo demo";
  return "Datos reales";
}

export function getEnvironmentDescription() {
  if (USE_MOCK_API) {
    return "La aplicación usa datos mock para demo visual.";
  }

  return "La aplicación está conectada a datos reales.";
}