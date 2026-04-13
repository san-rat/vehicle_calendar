# FleetTime UI Anti-Patterns (What NOT to Do)

This document outlines the **Anti-Patterns** for the FleetTime UI. It serves as a strict "Do Not" list for both human developers and Artificial Intelligence (AI) assistants working on this project. 

Our application is built on principles of **Mobile-First**, **Minimalism**, and **Streamlined User Experience**. Anything that violates these principles is forbidden.

---

## 1. AI Assistant Directives (Strict Rules for Code Generation)

AI assistants generating code or modifying the UI MUST adhere to the following rules to prevent technical debt and design drift:

*   **🚫 DO NOT use inline CSS styles (`style={{...}}`).** Everything must be styled using Tailwind CSS utility classes. If a highly dynamic value is needed, use standard Tailwind arbitrary values `w-[124px]` before resorting to inline styles.
*   **🚫 DO NOT write custom CSS in `globals.css` or CSS Modules unless absolutely unavoidable.** Before writing a custom class, prove that a Tailwind utility sequence cannot achieve the desired result.
*   **🚫 DO NOT ignore the `UI_Guideline.md` palette.** Never hardcode random hex colors like `#ff0000` or `#333333`. Always map colors to the established Base, Text, or Semantic (Success/Danger/Warning/Info/Primary) palette.
*   **🚫 DO NOT introduce external component libraries.** (e.g., Material-UI, Ant Design, Chakra UI, Bootstrap). The project relies on raw HTML elements styled with Tailwind CSS, or headless UI components (like Radix or HeadlessUI) only when complex accessibility is required.
*   **🚫 DO NOT hallucinate complex third-party date pickers.** The system relies on native or very lightweight calendar logic. Heavy libraries (like FullCalendar or react-big-calendar) should not be installed unless explicitly requested by the user.

---

## 2. Anti-Minimalism (Visual Clutter Avoidance)

The FleetTime UI is intended to be extremely clean. The following aesthetic choices are banned:

*   **🚫 DO NOT use gradients.** No background gradients, no text gradients. Flat colors only.
*   **🚫 DO NOT use aggressive or heavy box shadows.** Shadows should be subtle (`shadow-sm` or `shadow-md` at most) to slightly elevate cards and sheets. No dark drop shadows.
*   **🚫 DO NOT use heavy, dark borders.** Cards and inputs should have very light borders (`#E5E7EB`) or rely purely on background color contrast.
*   **🚫 DO NOT use more than two font families.** Stick to `Montserrat` for headings/actions and `Inter`/`Roboto` for body text. Do not introduce script, serif, or novelty fonts.
*   **🚫 DO NOT overload a single screen.** For example, do not cram the full Log list onto the Calendar page. Keep distinct features separated by navigation or clean modal sheets.

---

## 3. Mobile Anti-Patterns (Responsive Design Failures)

Since the application is "Mobile-First," desktop paradigms must not be shoehorned into mobile views:

*   **🚫 DO NOT enforce horizontal scrolling on main content.** (Except for specific data tables if absolutely necessary). The booking timeline and cards must fit the vertical flow of a phone screen.
*   **🚫 DO NOT rely on "Hover" states for crucial information.** Touchscreens do not have hover capabilities. If an action or piece of data is only visible on hover (e.g., a "Delete" button that only appears when hovering a log entry), it is broken on mobile. All actions must be visibly accessible or hidden behind a clear "Tap for details" / "Options" menu.
*   **🚫 DO NOT use Modals that cut off content on small screens.** If a modal requires scrolling *within* the modal frame on a phone, use a Bottom Slide-up Sheet instead, or route to a full-screen page.
*   **🚫 DO NOT make tap targets too small.** Buttons and clickable rows (especially on the calendar or timeline) must be at least `44px`-`48px` tall.

---

## 4. Form and Data Input Anti-Patterns

Forms must be frictionless and intuitive:

*   **🚫 DO NOT hide form labels inside the `placeholder` attribute.** When a user starts typing, the placeholder disappears, leaving them without context of what they are filling out. Always use visible labels positioned above the input field.
*   **🚫 DO NOT use example user identities as placeholders.** A placeholder like `"Super Admin"` looks like real data and weakens clarity on authentication and admin forms.
*   **🚫 DO NOT pad simple forms with explanatory filler copy.** The login screen and other obvious flows should stay stripped down to the essentials unless guidance is required to recover from an error.
*   **🚫 DO NOT use multi-step wizards for simple tasks.** The booking form process only requires a few fields (Time, Reason, All-day). Do not stretch this across multiple screens; it belongs on a single concise form or sheet.
*   **🚫 DO NOT use native HTML alerts/prompts (`alert()`, `confirm()`, `prompt()`).** These block the main thread and look terrible. Build integrated UI modals or use standard integrated toasts.
*   **🚫 DO NOT render full edit/delete forms inline on every admin list row.** Long members or vehicles lists must remain scannable; use a clear `Manage` trigger that opens a sheet/modal for secondary controls.
*   **🚫 DO NOT expose raw audit JSON in the routine log browsing flow.** System logs should prioritize readable rows over developer-facing payload inspection.

---

## 5. State, Feedback, & Error Anti-Patterns

Users must always know what the system is doing, but feedback should not be jarring.

*   **🚫 DO NOT use full-page loading spinners.** Avoid completely blocking the user's view while fetching routine data. 
*   **🚫 DO NOT use heavy "Skeleton" loaders.** As defined in the UI Guideline, the system uses simple, elegant rotating spinner animations for loading states.
*   **🚫 DO NOT display raw technical error messages.** Never show errors like `"Uncaught TypeError: Cannot read properties of undefined"` or `"SQLSTATE[23000]"` to the user.
*   **🚫 DO NOT display vague, ambiguous error messages.** Messages like "Something went wrong" or "Error" are useless. Use standard, descriptive, user-friendly language (e.g., "The selected time slot is no longer available" or "Unable to connect to the server. Please try again.").
*   **🚫 DO NOT leave empty states blank.** If a user has no bookings, do not just show a blank white screen. As defined in the UI Guideline, an empty state must always contain an attractive, illustrative icon and helpful text guiding the user on what to do next.

---
*End of Anti-Patterns Guideline.*
