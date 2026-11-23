# StudySpace

StudySpace helps BYU-Idaho students find a comfortable place to study and plan
individual or group study sessions.

- **Live site:** https://byui-study-space.github.io/study-space/
- **API:** https://study-space-api-production.up.railway.app/api/locations
  ([study-space-api](https://github.com/BYUI-Study-Space/study-space-api), Go + PostgreSQL)

## Where to find each requirement

| Requirement | Where |
|---|---|
| Detailed, validated form | `session-planner.html` + `js/session-planner.js`: client-side validation, API validation errors shown per field, and a modal confirmation dialog after a successful submit. |
| Local storage | `js/session-storage.js` saves the IDs of planned sessions in `localStorage` (`studyspace.savedSessionIds`). |
| Data fetching | `js/api.js` fetches locations and sessions from the API. On the home page, **Your Saved Sessions** (`js/saved-sessions.js`) reads the saved IDs and fetches each session again, so they are there on every return visit. The session planner's location list also comes from the API. |
| Drop-down menu | `js/navigation.js` + `css/base.css`: a **Menu** button opens a drop-down menu on small screens; on large screens (60rem+) the menu is horizontal. |
| CSS animation | `css/base.css` `menu-drop` (small-screen menu slides down), `css/home.css` `card-in` (location and saved-session cards fade in one after another whenever filters change), `css/session-planner.css` `confirmation-appear` / `backdrop-fade` (confirmation dialog). All animations are turned off with `prefers-reduced-motion`. |
| Responsive design | Mobile-first CSS with a `60rem` breakpoint on every page. |
| URL parameters | `session-planner.html?session=<id>` loads and shows that session. **View Session** links on the home page use it. |
| ES modules | `js/home.js`, `js/saved-sessions.js`, `js/session-planner.js`, `js/session-storage.js`, `js/api.js`. |

## Features

- **Location Finder** (home): filter study spots by type, Wi-Fi, group-friendly, and noise level.
- **Session Planner**: narrow the location list with the same filters, then plan a session with a date, start time, duration, type, and notes.
- **Your Saved Sessions** (home): sessions planned in this browser, loaded from the API.

## Team

April Ferris and Sebastian Lopez, WDD 231
