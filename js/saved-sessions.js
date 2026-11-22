import { ApiError, getSession } from "./api.js";
import {
  STORAGE_KEY,
  getSavedSessionIds,
  forgetSession
} from "./session-storage.js";

const list = document.querySelector("#saved-sessions-list");
const status = document.querySelector("#saved-sessions-status");
const empty = document.querySelector("#saved-sessions-empty");
const heading = document.querySelector("#saved-sessions-heading");
let renderVersion = 0;

function addDetail(details, label, value) {
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value ?? "Not provided";
  details.append(term, description);
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return value || "Not provided";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function buildCard(id, result) {
  const card = document.createElement("article");
  card.className = "saved-session-card";
  const title = document.createElement("h4");
  const actions = document.createElement("div");
  actions.className = "saved-session-actions";

  if (result.status === "fulfilled") {
    const session = result.value;
    title.textContent = session.location_name || "Saved study session";
    const details = document.createElement("dl");
    addDetail(details, "Date", formatDate(session.date));
    addDetail(details, "Time", session.start_time && session.end_time
      ? `${session.start_time}–${session.end_time}` : session.start_time);
    addDetail(details, "Duration", session.duration_minutes
      ? `${session.duration_minutes} minutes` : null);
    card.append(title, details);
  } else {
    title.textContent = "Saved session unavailable";
    const message = document.createElement("p");
    message.textContent = result.reason instanceof ApiError && result.reason.status === 404
      ? "This session could not be found. You can remove its reference from this browser."
      : "The session service could not be reached. Your saved reference is still here; try again later.";
    card.append(title, message);
  }

  const view = document.createElement("a");
  view.className = "button-link";
  view.href = `session-planner.html?session=${encodeURIComponent(id)}`;
  view.textContent = "View Session";
  view.setAttribute("aria-label", `View session ${id}: ${title.textContent}`);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove from List";
  remove.setAttribute("aria-label", `Remove session ${id} from this browser's list`);
  remove.addEventListener("click", async () => {
    try {
      forgetSession(id);
    } catch {
      status.textContent = "This browser could not update your saved list. Nothing was removed.";
      return;
    }
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
    await renderSavedSessions("Session removed from this browser's list. It was not cancelled. ");
  });

  actions.append(view, remove);
  card.append(actions);
  return card;
}

async function renderSavedSessions(prefix = "") {
  if (!list || !status || !empty) return;
  const version = ++renderVersion;
  list.replaceChildren();
  empty.hidden = true;
  let ids;
  try {
    ids = getSavedSessionIds();
  } catch {
    status.textContent = "This browser could not read your saved sessions. Browser storage may be blocked or its saved list may be damaged.";
    return;
  }

  if (!ids.length) {
    empty.hidden = false;
    status.textContent = prefix;
    return;
  }

  status.textContent = `${prefix}Loading saved sessions…`;
  const results = await Promise.allSettled(ids.map(async (id) => {
    // A timeout keeps an unresponsive service from leaving the list loading forever.
    let timer;
    try {
      return await Promise.race([
        getSession(id).then((session) => {
          if (!session || typeof session !== "object") throw new Error("Invalid session response.");
          return session;
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("Request timed out.")), 12000);
        })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }));

  if (version !== renderVersion) return;
  results.forEach((result, index) => list.append(buildCard(ids[index], result)));
  const loaded = results.filter((result) => result.status === "fulfilled").length;
  status.textContent = `${prefix}${loaded} of ${ids.length} saved session(s) loaded.`;
}

// Read local storage and fetch API data again on return visits.
window.addEventListener("pageshow", () => renderSavedSessions());
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY || event.key === null) renderSavedSessions();
});
renderSavedSessions();
