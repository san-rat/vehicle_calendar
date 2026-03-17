# FleetTime UX Guideline

This document defines the **User Experience (UX)** philosophy and functional interactions for the **FleetTime** Car Scheduling System. While the UI Guideline dictates how the application *looks*, this document dictates how it *feels* and *behaves*. 

The core UX goals are to minimize friction for end-users while providing robust, efficient control for Super Admins.

---

## 1. Navigation & Routing (The "Where am I?" Factor)

Navigation must feel unified and predictable, specifically optimized for the "Mobile-First" paradigm.

### 1.1 The Hamburger Menu
- **Mobile Paradigm**: All primary navigation (Home/Vehicles, Calendar, Logs, Settings) is housed behind a sleek **Hamburger Menu** located in the Top Bar. This maximizes the vertical screen real estate for the calendar timeline and booking forms.
- **Desktop Paradigm**: On wider screens, the hamburger menu may elegantly expand into a permanent left-hand sidebar or top horizontal navigation links to reduce clicks.

### 1.2 The "Back" Interaction
- **Discarding Drafts**: If a user is actively filling out the Booking Form and hits the physical "Back" button on their device (or the browser back button), the app will **discard the draft** and return them to the clean Calendar view. 
- *Rationale*: We prioritize the Calendar as the "Home Base" for scheduling; users should not get trapped in dirty form states.

---

## 2. Data Liveness & Refresh Rates

Since FleetTime manages shared physical assets, the calendar data must feel accurate to prevent double-booking attempts.

### 2.1 The 2-Minute Polling Rule
- **Active Refresh**: When a user is viewing the Calendar Timeline or Request List, the application will silently auto-refresh (poll) the data every **2 minutes**.
- **UX Impact**: If another user books a vehicle while the current user is looking at the screen, the new colored block will appear without requiring a manual page reload.
- **Manual Override**: Users can always trigger an immediate refresh by pulling down on the screen (mobile pull-to-refresh) or navigating between dates.

---

## 3. The Booking Flow Friction

A primary goal of FleetTime is speed. Members should be able to book a vehicle in seconds.

### 3.1 Single-Click Submission
- There are **no confirmation modals** ("Are you sure you want to book this?") for standard bookings. 
- Once the user fills in the time and taps the primary **"Book Trip"** (or "Request Booking") button, the system immediately submits the data.

### 3.2 Immediate Feedback (Toasts)
- Upon tapping the submit button, the form swaps back to the timeline view, and an immediate **Success Toast** (e.g., "Booking Saved ✅") slides in over the UI. This provides closure without interrupting the flow.
- If an error occurs (e.g., the slot was taken right before they clicked submit), a descriptive **Error Toast** appears without losing the user's form data.

---

## 4. Admin Efficiency workflows (Super Admin UX)

Super Admins must manage the system efficiently, especially if the organization uses the "Booking Freedom = OFF" setting, generating many requests.

### 4.1 Bulk Actions (Request List)
- Admins will see the Request List with **checkboxes** next to each row.
- They can select multiple requests and execute a **Bulk Approve** or **Bulk Reject** action from a sticky bottom or top action bar. 
- *Rationale*: This prevents administrative fatigue when dealing with dozens of routine daily requests.

### 4.2 Overriding Bookings
- When a Super Admin needs to override an existing booking (due to a conflict), the UX heavily flags this action with the **Warning** color.
- A reason/description for the override is optional, but heavily encouraged via a focused text area.

---

## 5. Onboarding & Empty States

Initial impressions dictate user adoption.

### 5.1 The "Clean Slate" Empty State
- When a new member logs in for the first time, there is no heavy guided tutorial or forced modal overlay. They are presented with the clean, raw UI.
- Instead, the UI relies on **Action-Oriented Empty States**. If there are no bookings, the timeline shows an attractive icon indicating "No trips scheduled." with a clear, pulsating call-to-action button pointing them to the "Book" button.
- *Future Enhancement*: A dedicated, static "Help" or "How to Use" page will be added to the Hamburger menu for users who prefer explicit instructions.

---
*End of UX Guideline.*
