// Small client for the StudySpace API (study-space-api).

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const PRODUCTION_API_URL = "https://study-space-api-production.up.railway.app/api";

export const API_BASE_URL = LOCAL_HOSTS.includes(window.location.hostname)
  ? "http://localhost:3000/api"
  : PRODUCTION_API_URL;

// ApiError carries the API's error message and, for validation errors,
// a `fields` object keyed by input name.
export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error ?? `Request failed (${response.status})`,
      data?.fields ?? {}
    );
  }
  return data;
}

// getLocations accepts optional filters: { wifi, group, noise }.
export function getLocations(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return request(`/locations${query ? `?${query}` : ""}`);
}

export function getSession(id) {
  return request(`/sessions/${encodeURIComponent(id)}`);
}

export function createSession(session) {
  return request("/sessions", {
    method: "POST",
    body: JSON.stringify(session),
  });
}
