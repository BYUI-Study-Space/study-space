import { ApiError, createSession, getLocations, getSession } from "./api.js";
import { rememberSession } from "./session-storage.js";

const form = document.querySelector("#session-form");
const locationSelect = document.querySelector("#location");
const locationHours = document.querySelector("#location-hours");
const dateInput = document.querySelector("#date");
const durationSelect = document.querySelector("#duration");
const groupRadio = document.querySelector("#type-group");
const groupSizeField = document.querySelector("#group-size-field");
const groupSizeInput = document.querySelector("#group-size");
const submitButton = form.querySelector(".submit-button");
const formStatus = document.querySelector("#form-status");
const confirmation = document.querySelector("#confirmation");
const confirmationHeading = document.querySelector("#confirmation-heading");
const confirmationSummary = document.querySelector("#confirmation-summary");
const confirmationClose = document.querySelector("#confirmation-close");
const locationFilters = document.querySelector("#location-filters");
const filterWifi = document.querySelector("#filter-wifi");
const filterGroup = document.querySelector("#filter-group");
const filterNoise = document.querySelector("#filter-noise");
const locationFilterStatus = document.querySelector("#location-filter-status");

const locationsById = new Map();

/* Helpers */

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function selectedLocation() {
  return locationsById.get(Number(locationSelect.value));
}

function isGroupSession() {
  return form.elements.session_type.value === "group";
}

function setStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.classList.toggle("is-error", isError);
}

/* Locations */

async function loadLocations() {
  try {
    const locations = await getLocations();

    for (const location of locations) {
      locationsById.set(location.id, location);
    }
    locationFilters.disabled = false;
    applyLocationFilters();
  } catch {
    locationSelect.replaceChildren(new Option("Locations unavailable", ""));
    submitButton.disabled = true;
    setStatus("We couldn't load study locations. Please try again later.", true);
  }
}

// Rebuilds the location list from the filters, keeping the current
// choice when it still matches.
function applyLocationFilters() {
  if (locationsById.size === 0) return;

  const current = locationSelect.value;
  const matches = [...locationsById.values()].filter((location) =>
    (!filterWifi.checked || location.has_wifi) &&
    (!filterGroup.checked || location.group_friendly) &&
    (!filterNoise.value || location.noise_level === filterNoise.value)
  );

  locationSelect.replaceChildren(new Option(
    matches.length > 0 ? "Choose a location" : "No locations match these filters",
    ""
  ));
  for (const location of matches) {
    locationSelect.append(
      new Option(`${location.name} — ${location.building}`, location.id)
    );
  }

  if (matches.some((location) => String(location.id) === current)) {
    locationSelect.value = current;
  } else if (current) {
    updateLocationDetails();
  }

  locationFilterStatus.textContent =
    `${matches.length} of ${locationsById.size} locations match.`;
}

function updateLocationDetails() {
  const location = selectedLocation();

  if (!location) {
    locationHours.textContent = "";
    groupRadio.disabled = false;
    groupSizeInput.removeAttribute("max");
    return;
  }

  const groupInfo = location.group_friendly
    ? `groups up to ${location.capacity}`
    : "individual study only";
  const wifiInfo = location.has_wifi ? "Wi-Fi" : "no Wi-Fi";
  locationHours.textContent =
    `Open ${location.open_time}–${location.close_time} · ${groupInfo} · ` +
    `${wifiInfo} · ${location.noise_level} noise`;

  groupRadio.disabled = !location.group_friendly;
  if (!location.group_friendly && groupRadio.checked) {
    form.elements.session_type.value = "individual";
  }
  groupSizeInput.max = location.capacity;
  updateSessionType();
}

function updateSessionType() {
  const isGroup = isGroupSession();
  groupSizeField.hidden = !isGroup;
  groupSizeInput.required = isGroup;
  if (!isGroup) {
    groupSizeInput.value = "";
    clearFieldError("group_size");
  }
}

/* Validation messages */

// Turns API messages such as "is required" into a full sentence.
function toSentence(message) {
  const text = /^(is|must|cannot|exceeds) /.test(message)
    ? `This field ${message}`
    : message;
  return text.charAt(0).toUpperCase() + text.slice(1) + (text.endsWith(".") ? "" : ".");
}

function messageFor(field) {
  const { validity } = field;

  if (validity.valueMissing) {
    return field.tagName === "SELECT" ? "Please choose an option." : "This field is required.";
  }
  if (validity.typeMismatch && field.type === "email") {
    return "Enter a valid email address.";
  }
  if (validity.rangeUnderflow) {
    return field.type === "date" ? "Date cannot be in the past." : `Must be at least ${field.min}.`;
  }
  if (validity.rangeOverflow) {
    return `This location fits at most ${field.max} people.`;
  }
  if (validity.tooLong) {
    return `Must be at most ${field.maxLength} characters.`;
  }
  return field.validationMessage;
}

function validateForm() {
  const errors = {};

  for (const field of form.elements) {
    if (field.name && field.willValidate && !field.validity.valid && !errors[field.name]) {
      errors[field.name] = messageFor(field);
    }
  }

  // Check the schedule against the location's hours, like the API does.
  const location = selectedLocation();
  const { date, start_time: startTime } = form.elements;
  if (location && startTime.value && !errors.start_time) {
    const start = toMinutes(startTime.value);
    const duration = Number(durationSelect.value);

    if (date.value === todayISO() && start < toMinutes(new Date().toTimeString().slice(0, 5))) {
      errors.start_time = "Start time cannot be in the past.";
    } else if (
      start < toMinutes(location.open_time) ||
      (duration && start + duration > toMinutes(location.close_time))
    ) {
      errors.start_time =
        `Session must fit within opening hours (${location.open_time}–${location.close_time}).`;
    }
  }

  return errors;
}

function clearFieldError(name) {
  const errorElement = document.getElementById(`${name}-error`);
  if (errorElement) {
    errorElement.textContent = "";
  }
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLElement) {
    field.removeAttribute("aria-invalid");
  }
}

function clearErrors() {
  form.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach((element) => {
    element.removeAttribute("aria-invalid");
  });
  setStatus("");
}

// Shows one message per field and focuses the first invalid field.
function showErrors(errors) {
  let firstInvalid = null;
  const unmatched = [];

  for (const [name, message] of Object.entries(errors)) {
    const errorElement = document.getElementById(`${name}-error`);
    if (!errorElement) {
      unmatched.push(toSentence(message));
      continue;
    }
    errorElement.textContent = toSentence(message);

    const field = form.elements.namedItem(name);
    if (field instanceof HTMLElement) {
      field.setAttribute("aria-invalid", "true");
    }
  }

  for (const field of form.elements) {
    if (field.name in errors && !field.disabled) {
      firstInvalid = field;
      break;
    }
  }

  setStatus(
    unmatched.length > 0
      ? unmatched.join(" ")
      : "Please fix the highlighted fields.",
    true
  );
  firstInvalid?.focus();
}

/* Submit and confirmation */

function buildSession() {
  const data = new FormData(form);
  const session = {
    location_id: Number(data.get("location_id")),
    student_name: data.get("student_name").trim(),
    email: data.get("email").trim(),
    student_id: data.get("student_id").trim(),
    date: data.get("date"),
    start_time: data.get("start_time"),
    duration_minutes: Number(data.get("duration_minutes")),
    session_type: data.get("session_type"),
    notes: data.get("notes").trim(),
  };
  if (session.session_type === "group") {
    session.group_size = Number(data.get("group_size"));
  }
  return session;
}

function showConfirmation(session) {
  const durationLabel =
    durationSelect.querySelector(`option[value="${session.duration_minutes}"]`)?.textContent ??
    `${session.duration_minutes} minutes`;

  const rows = [
    ["Name", session.student_name],
    ["Location", session.location_name],
    ["Date", formatDate(session.date)],
    ["Time", `${session.start_time}–${session.end_time}`],
    ["Duration", durationLabel],
    [
      "Type",
      session.session_type === "group" ? `Group of ${session.group_size}` : "Individual",
    ],
    ["Notes", session.notes || "None"],
  ];

  confirmationSummary.replaceChildren(
    ...rows.flatMap(([term, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = value;
      return [dt, dd];
    })
  );

  openConfirmation();
}

// The confirmation is a modal dialog so it can't be missed at the
// bottom of the page. Escape, Close, or a backdrop click close it.
function openConfirmation() {
  if (!confirmation.open) {
    confirmation.showModal();
  }
  confirmationHeading.focus();
}

function closeConfirmation() {
  if (confirmation.open) {
    confirmation.close();
  }
}

// Shows the session named in the URL (?session=<id>), so a confirmation
// can be reloaded or shared after the form is submitted.
async function showSessionFromUrl() {
  const sessionId = new URLSearchParams(window.location.search).get("session");

  if (!sessionId) {
    closeConfirmation();
    return;
  }

  try {
    showConfirmation(await getSession(sessionId));
  } catch (error) {
    closeConfirmation();
    setStatus(
      error instanceof ApiError && error.status === 404
        ? "We couldn't find that study session."
        : "We couldn't load that study session. Please try again later.",
      true
    );
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    return;
  }

  submitButton.disabled = true;
  setStatus("Saving your session…");

  try {
    const session = await createSession(buildSession());
    form.reset();
    updateLocationDetails();
    updateSessionType();
    // The API has saved the session. A browser-storage failure must not
    // falsely report that the API submission failed or encourage a duplicate.
    let savedMessage = "Your session has been saved";
    try {
      rememberSession(session.id);
    } catch {
      savedMessage += ". This browser could not remember it. Keep the confirmation link to reopen it later.";
    }
    setStatus(savedMessage);
    history.pushState(null, "", `?session=${encodeURIComponent(session.id)}`);
    showConfirmation(session);
  } catch (error) {
    if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
      showErrors(error.fields);
    } else if (error instanceof ApiError) {
      setStatus(toSentence(error.message), true);
    } else {
      setStatus("We couldn't reach the server. Please try again.", true);
    }
  } finally {
    submitButton.disabled = false;
  }
}

//Counter, Preview, and Clear Form//
dateInput.min = todayISO();

locationSelect.addEventListener("change", updateLocationDetails);
form.addEventListener("change", (event) => {
  if (event.target.name === "session_type") {
    updateSessionType();
  }
});
form.addEventListener("input", (event) => {
  if (event.target.name) {
    clearFieldError(event.target.name);
  }
});
form.addEventListener("submit", handleSubmit);
window.addEventListener("popstate", showSessionFromUrl);

confirmationClose.addEventListener("click", closeConfirmation);
confirmation.addEventListener("click", (event) => {
  // The dialog itself is only the target when the backdrop is clicked.
  if (event.target === confirmation) {
    closeConfirmation();
  }
});

for (const filter of [filterWifi, filterGroup, filterNoise]) {
  filter.addEventListener("change", applyLocationFilters);
}
form.addEventListener("reset", () => {
  setTimeout(applyLocationFilters, 0);
});

loadLocations();
showSessionFromUrl();

(() => {
  const notesInput = form.elements.notes;
  const notesHint = document.querySelector("#notes-hint");


  function updateNotesCounter() {
    notesHint.textContent =
      `${notesInput.value.length} of ${notesInput.maxLength} characters used.`;
  }

  notesInput.addEventListener("input", updateNotesCounter);


  const preview = document.createElement("section");
  preview.className = "session-preview";
  preview.setAttribute("aria-labelledby", "session-preview-heading");

  const previewHeading = document.createElement("h3");
  previewHeading.id = "session-preview-heading";
  previewHeading.textContent = "Your Session Preview";

  const previewDetails = document.createElement("dl");

  preview.append(previewHeading, previewDetails);
  submitButton.before(preview);

  function updateSessionPreview() {
    const selectedOption = locationSelect.selectedOptions[0];

    const locationText = locationSelect.value
      ? selectedOption.textContent
      : "Choose a location";

    const dateText = form.elements.date.value
      ? formatDate(form.elements.date.value)
      : "Choose a date";

    const timeText = form.elements.start_time.value || "Choose a time";

    const durationText = durationSelect.value
      ? durationSelect.selectedOptions[0].textContent
      : "Choose a duration";

    const typeText = isGroupSession()
      ? `Group — ${groupSizeInput.value || "enter group size"}`
      : "Individual";

    const details = [
      ["Location", locationText],
      ["Date", dateText],
      ["Start time", timeText],
      ["Duration", durationText],
      ["Session type", typeText],
    ];

    previewDetails.replaceChildren();

    for (const [label, value] of details) {
      const term = document.createElement("dt");
      const description = document.createElement("dd");

      term.textContent = label;
      description.textContent = value;

      previewDetails.append(term, description);
    }
  }

  form.addEventListener("input", updateSessionPreview);
  form.addEventListener("change", updateSessionPreview);


  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "clear-form-button";
  clearButton.textContent = "Clear Form";

    submitButton.before(clearButton);


  clearButton.addEventListener("click", () => {
    form.reset();
    clearErrors();
    closeConfirmation();

    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.delete("session");
    history.replaceState(null, "", pageUrl);

    setStatus("Form cleared.");
    form.elements.student_name.focus();
  });


  form.addEventListener("reset", () => {
    setTimeout(() => {
      updateLocationDetails();
      updateSessionType();
      updateNotesCounter();
      updateSessionPreview();
    }, 0);
  });

  updateNotesCounter();
  updateSessionPreview();
})();
