export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const USE_MOCK_API = String(import.meta.env.VITE_USE_MOCK_API) === "true";

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }

  return response.json();
}