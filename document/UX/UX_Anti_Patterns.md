# FleetTime UX Anti-Patterns (What NOT to Do)

This document outlines the **UX Anti-Patterns** for the FleetTime application. While the *UI Anti-Patterns* document prevents poor visual design, this document exists to prevent AI assistants and human developers from programming frustrating, confusing, or over-engineered user flows.

Every interaction in FleetTime must be intuitive and frictionless. The following practices are strictly forbidden.

---

## 1. Navigation & Routing Anti-Patterns

Users must always feel in control of where they are and how to go back.

*   **🚫 DO NOT trap the user.** Every screen, especially forms and settings, must have a clear "Cancel" or "Close" button, or an obvious back-arrow if not using the hamburger menu.
*   **🚫 DO NOT use the browser "Back" button to submit data.** Hitting the hardware/software back button must exclusively serve as a "Cancel/Return" action. If a user hits back while filling out a booking, the draft *must* safely discard without throwing warnings or attempting to save.
*   **🚫 DO NOT open internal links in new tabs (`target="_blank"`).** FleetTime is designed to feel like a single cohesive app. Opening standard pages (like the log or settings) in new tabs breaks the mobile flow.

---

## 2. State Management & Data Anti-Patterns

Over-engineering kills performance and maintainability.

*   **🚫 DO NOT use heavy global state managers (like Redux or Zustand) unnecessarily.** The application's state needs are simple. Rely on React Context, standard prop drilling, and Server Components where appropriate.
*   **🚫 DO NOT implement WebSockets for calendar updates.** A simple, silent 2-minute polling interval (as defined in the UX Guideline) is sufficient for live data. WebSockets are over-engineered for this use case and consume unnecessary resources.
*   **🚫 DO NOT allow "Stale" Data on focus.** If a user leaves the app running in the background on their phone and returns to it 3 hours later, the timeline must automatically refresh upon regaining window focus to prevent them from booking a taken slot.

---

## 3. Friction & Flow Anti-Patterns

We want members to book vehicles in seconds.

*   **🚫 DO NOT use "Are you sure?" confirmation modals for routine actions.** Standard bookings do not require a confirmation popup. Super Admins approving or rejecting routine requests do not need confirmation popups. Only highly destructive actions (like permanently deleting a vehicle or an override) require confirmation.
*   **🚫 DO NOT use multi-step wizards.** If a user needs to input information, it should be consolidated onto a single clean form page or slide-up sheet. Do not force them to tap "Next" multiple times for the start time, end time, and reason separately.
*   **🚫 DO NOT provide multiple buttons that do the same thing.** A primary action (like "Book Trip") should exist in exactly one obvious place on the form.

---

## 4. Notifications & Feedback Anti-Patterns

Users need to know what happened without being annoyed.

*   **🚫 DO NOT use persistent, blocking banners.** Success messages must be implemented as auto-dismissing Toasts (sliding in and out after ~3 seconds). Do not use banners that push the entire page layout down and force the user to manually click an 'X' to dismiss them.
*   **🚫 DO NOT spam toasts for grouped actions.** If an admin bulk-approves 5 requests, they should get one toast reading "5 Requests Approved", *not* 5 individual toasts popping up simultaneously.

---

## 5. Super Admin Overload Anti-Patterns

Super Admins are busy. We cannot create administrative fatigue.

*   **🚫 DO NOT force single-action workflows on lists.** Super Admins *must* have checkboxes to select multiple booking requests for Bulk Approval/Rejection. Forcing them to click "Approve" 20 individual times on a Monday morning is a UX failure.
*   **🚫 DO NOT hide "Override" workflows or warnings.** Overriding a confirmed booking is a severe action. The UX must never obscure this action; it must be clearly visible and permanently logged.

---

## 6. Dead Ends & Error Recovery Anti-Patterns

Networks fail. The UI must handle it gracefully.

*   **🚫 DO NOT use "Dead End" error screens.** If a network request fails (e.g., Supabase is momentarily unreachable), do not show a blank screen with a red error string. The UI must retain the user's focus, keep their form data intact, and provide a clear "Retry" button.
*   **🚫 DO NOT clear forms aggressively on failure.** If a user spends time typing a long reason for a booking, and the submission fails due to an edge case (like the slot just being taken), *preserve their input text* so they can just adjust the time and try again.

---
*End of UX Anti-Patterns Guideline.*
