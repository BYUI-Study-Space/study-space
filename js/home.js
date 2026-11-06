

const locationForm = document.querySelector("#location-filters");
const locationType = document.querySelector("#location-type");
const wifiOnly = document.querySelector("#wifi-only");
const locationList = document.querySelector("#location-list");
const filterStatus = document.querySelector("#filter-status");

const locations = [
  { name: "Gardens Picnic Tables", type: "outdoor" },
  { name: "Hinckley Study Lounge", type: "lounge" },
  { name: "Library Group Rooms", type: "library" },
  { name: "Library Quiet Floor", type: "library" },
  { name: "Manwaring Commons", type: "commons" },
  { name: "Math Study Center", type: "center" }
];

locationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedType = locationType.value;

  const filteredLocations = locations.filter((location) => {
    return selectedType === "all" || location.type === selectedType;
  });

  locationList.innerHTML = "";

  filteredLocations.forEach((location) => {
    const card = document.createElement("article");
    card.className = "location-card";

    const heading = document.createElement("h3");
    heading.textContent = location.name;

    card.appendChild(heading);
    locationList.appendChild(card);
  });

  filterStatus.textContent =
    `${filteredLocations.length} study location(s) found.`;
});