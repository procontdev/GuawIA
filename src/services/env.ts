export const USE_MOCK_API = String(import.meta.env.VITE_USE_MOCK_API) === "true";

export function getEnvironmentLabel() {
  return USE_MOCK_API ? "Modo demo" : "Datos reales";
}

export function getEnvironmentDescription() {
  return USE_MOCK_API
    ? "La app está usando datos simulados."
    : "La app está conectada a n8n y Postgres.";
}