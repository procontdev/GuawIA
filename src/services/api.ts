export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const USE_MOCK_API =
  String(import.meta.env.VITE_USE_MOCK_API) === "true";

async function parseJsonSafe(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      `GET ${path} failed with status ${response.status}${
        data ? ` | ${typeof data === "string" ? data : JSON.stringify(data)}` : ""
      }`
    );
  }

  return data as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      `POST ${path} network error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      `POST ${path} failed with status ${response.status}${
        data ? ` | ${typeof data === "string" ? data : JSON.stringify(data)}` : ""
      }`
    );
  }

  return data as T;
}