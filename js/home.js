const locationForm = document.querySelector("#location-filters");
const locationType = document.querySelector("#location-type");
const wifiOnly = document.querySelector("#wifi-only");
const locationList = document.querySelector("#location-list");
const filterStatus = document.querySelector("#filter-status");

const libraryHours =
  "Mon–Thu: 7:00 a.m.–11:30 p.m.; " +
  "Fri: 7:00 a.m.–9:00 p.m.; " +
  "Sat: 9:00 a.m.–9:00 p.m.; Sun: closed. " +
  "Tuesday devotional closure: 11:25 a.m.–12:25 p.m.";

const locations = [
  {
    name: "Gardens Picnic Tables",
    type: "outdoor",
    description: "An outdoor setting for studying.",
    location: "Thomas E. Ricks Horticulture Gardens, BYU–Idaho",
    wifi: null,
    hours: "Public gardens; specific opening hours not published."
  },
  {
    name: "Hinckley Study Lounge",
    type: "lounge",
    description: "An indoor space for individual study.",
    location: "Gordon B. Hinckley Building, BYU–Idaho",
    wifi: true,
    hours:
      "Mon–Sat: 6:00 a.m.–11:30 p.m. " +
      "(General academic-building hours; lounge access may vary.)"
  },
  {
    name: "Library Group Rooms",
    type: "library",
    description: "Study rooms for working with classmates.",
    location: "David O. McKay Library, BYU–Idaho",
    wifi: true,
    hours:
      libraryHours +
      " Group-room availability depends on reservations."
  },
  {
    name: "Library Quiet Floor",
    type: "library",
    description: "A quiet setting for focused, individual study.",
    location: "David O. McKay Library, BYU–Idaho",
    wifi: true,
    hours: libraryHours
  },
  {
    name: "Manwaring Commons",
    type: "commons",
    description: "A shared campus setting for studying.",
    location: "Hyrum Manwaring Student Center, BYU–Idaho",
    wifi: true,
    hours:
      "Mon–Sat: 6:00 a.m.–11:30 p.m. " +
      "(Building hours; individual areas may vary.)"
  },
  {
    name: "Math Study Center",
    type: "center",
    description: "Drop-in math help and tutoring.",
    location: "McKay Library, Room 170, BYU–Idaho",
    wifi: true,
    hours:
      "Mon and Fri: 9:00 a.m.–6:30 p.m.; " +
      "Tue–Thu: 9:00 a.m.–9:00 p.m.; " +
      "Sat: 11:00 a.m.–4:00 p.m.; Sun: closed. " +
      "Closed during Tuesday devotional."
  }
];

// Indoor Wi-Fi values assume campus network access.
// Confirm coverage at individual spaces before treating it as guaranteed.

/* Add a labeled detail to a card */

function addDetail(details, label, value) {
  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = value;

  details.append(term, description);
}

/* Show matching cards in the existing sample-card area */

function displayLocations(filteredLocations) {
  locationList.replaceChildren();

  filteredLocations.forEach((location) => {
    const card = document.createElement("article");
    card.className = "location-card";

    const heading = document.createElement("h3");
    heading.textContent = location.name;

    const introduction = document.createElement("p");
    introduction.textContent = location.description;

    const details = document.createElement("dl");

    const wifiText =
      location.wifi === true
        ? "Yes — campus Wi-Fi"
        : location.wifi === false
          ? "No"
          : "Coverage not confirmed";

    addDetail(details, "Location", location.location);
    addDetail(details, "Wi-Fi", wifiText);
    addDetail(details, "Hours", location.hours);

    card.append(heading, introduction, details);
    locationList.appendChild(card);
  });

  if (filteredLocations.length === 0) {
    filterStatus.textContent =
      "No matching locations found. Try another type or uncheck Wi-Fi.";
  } else {
    const count = filteredLocations.length;

    filterStatus.textContent =
      `${count} study location${count === 1 ? "" : "s"} found. ` +
      "Hours are Mountain Time; holiday and break schedules may differ.";
  }
}

/* Apply the selected location and Wi-Fi filters */

function filterLocations() {
  const filteredLocations = locations.filter((location) => {
    const matchesType =
      locationType.value === "all" ||
      location.type === locationType.value;

    const matchesWifi =
      !wifiOnly.checked || location.wifi === true;

    return matchesType && matchesWifi;
  });

  displayLocations(filteredLocations);
}

/* Filter when the button is clicked */

locationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  filterLocations();
});

/* Also update immediately when a selection changes */

locationType.addEventListener("change", filterLocations);
wifiOnly.addEventListener("change", filterLocations);

/* Enable filters and replace the sample content on page load */

locationForm.querySelector("fieldset").disabled = false;
filterLocations();