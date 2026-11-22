/* Shared mobile navigation; desktop links stay horizontal through CSS. */
"use strict";

(() => {
  const navigation = document.querySelector('.site-header nav[aria-label="Main navigation"]');
  if (!navigation) return;
  const button = navigation.querySelector(".menu-toggle");
  const links = navigation.querySelector(".nav-links");
  if (!button || !links) return;

  const desktop = window.matchMedia("(min-width: 60rem)");
  function closeMenu(focusButton = false) {
    button.setAttribute("aria-expanded", "false");
    if (focusButton) button.focus();
  }

  button.hidden = false;
  navigation.classList.add("navigation-ready");

  button.addEventListener("click", () => {
    button.setAttribute("aria-expanded",
      String(button.getAttribute("aria-expanded") !== "true"));
  });

  navigation.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !desktop.matches &&
        button.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });

  links.addEventListener("click", (event) => {
    if (event.target.closest("a") && !desktop.matches) closeMenu();
  });

  desktop.addEventListener("change", () => {
    closeMenu(!desktop.matches && links.contains(document.activeElement));
  });
})();
