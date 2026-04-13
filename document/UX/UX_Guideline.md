# FleetTime UX Guideline

This document defines the **User Experience (UX)** philosophy and functional interactions for the **FleetTime** Car Scheduling System. While the UI Guideline dictates how the application *looks*, this document dictates how it *feels* and *behaves*. 

The core UX goals are to minimize friction for end-users while providing robust, efficient control for Super Admins.

---

## 1. Navigation & Routing (The "Where am I?" Factor)

Navigation must feel unified and predictable, specifically optimized for the "Mobile-First" paradigm.

### 1.1 The Hamburger Menu
- **Mobile Paradigm**: Primary navigation lives behind a **Hamburger Menu** in the Top Bar. The trigger sits on the left, the FleetTime brand stays visually centered, and the drawer holds Vehicles/Home, Log, Settings when allowed, the current user label, and Logout.
- **Desktop Paradigm**: On wider screens, keep the navigation inline in the top bar with low-emphasis ghost actions and a clearly separated logout control.
- **Goal**: Preserve screen real estate for booking and admin workflows without making navigation hard to reach.

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

### 4.1 Focused Review Cards (Request List)
- Admins should see each request as a compact review card that groups the request summary, conflict state, and primary actions without forcing excessive vertical scrolling.
- Approval, override, rejection, and "Open booking day" controls should feel clustered and readable, but the flow remains single-request focused unless bulk review is explicitly added later.
- *Rationale*: The immediate goal is fast review with strong visual hierarchy, not hidden or overloaded admin controls.

### 4.2 Overriding Bookings
- When a Super Admin needs to override an existing booking (due to a conflict), the UX heavily flags this action with the **Warning** color.
- A reason/description for the override is optional, but heavily encouraged via a focused text area.

---

## 5. Onboarding & Empty States

Initial impressions dictate user adoption.

### 5.1 The "Clean Slate" Empty State
- When a new member logs in for the first time, there is no heavy guided tutorial or forced modal overlay. They are presented with the clean, raw UI.
- Instead, the UI relies on **Action-Oriented Empty States**. If there are no bookings, the timeline shows an attractive icon indicating "No trips scheduled." with a clear, pulsating call-to-action button pointing them to the "Book" button.
- The login screen itself should not add onboarding prose. Authentication is a known action and should stay visually minimal.
- *Future Enhancement*: A dedicated, static "Help" or "How to Use" page will be added to the Hamburger menu for users who prefer explicit instructions.

## 6. Dense Admin List Management

### 6.1 Compact Lists + Focused Detail
- Members and Vehicles pages should keep their default list view read-only and easy to scan.
- Secondary tasks such as editing, password reset, and hard delete confirmation should open in an adaptive sheet/modal so the main list remains compact.
- The backdrop should clearly blur and dim the underlying page so the focused management task reads as a true modal layer.
- Closing that sheet/modal must return the user to the same list context without disorienting route changes.

---
*End of UX Guideline.*
