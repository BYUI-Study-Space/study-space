/* Store only session IDs, not student details. */
const STORAGE_KEY = "studyspace.savedSessionIds";

export { STORAGE_KEY };

function normalizeId(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("Invalid session ID.");
  }
  const id = String(value).trim();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    throw new Error("Invalid session ID.");
  }
  return id;
}

export function getSavedSessionIds() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const ids = JSON.parse(raw);
  if (!Array.isArray(ids)) throw new Error("Saved session list is invalid.");
  return [...new Set(ids.map(normalizeId))];
}

export function rememberSession(id) {
  const normalized = normalizeId(id);
  const ids = getSavedSessionIds();
  if (!ids.includes(normalized)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, normalized]));
  }
}

export function forgetSession(id) {
  const normalized = normalizeId(id);
  const ids = getSavedSessionIds().filter((saved) => saved !== normalized);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
