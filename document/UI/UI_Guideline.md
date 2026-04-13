# FleetTime UI Guideline

This document serves as the comprehensive and definitive source of truth for the User Interface (UI) and User Experience (UX) of the **FleetTime** Car Scheduling System. It builds upon the established global privilege settings and data structure and provides atomic-level detail on the visual language, component behavior, page structure, and interaction patterns required.

The design philosophy is strictly **Mobile-First**, **Minimalistic**, **Modern**, and **Streamlined**.

---

## 1. Design Principles & Aesthetics

The UI must avoid clutter. It relies on whitespace, subtle shadows, rounded corners, and clear typographic hierarchy.
- **Mobile-First & Adaptive**: Designed first for touch screens (smartphones) and fluidly adapts to larger screens (tablets/desktops).
- **Minimalistic**: Content is king. Avoid unnecessary borders, background boxes, or decorative elements that don't serve a function.
- **Streamlined**: Flows should be intuitive with the fewest possible taps to achieve a goal.
- **Modern Styling**: Soft backgrounds (off-white/gray) with stark white cards and vibrant, distinct accent colors.

---

## 2. Typography

The system utilizes two typefaces provided via Google Fonts. All text should be rendered cleanly with careful attention to line height and letter spacing.

1.  **Headings & Buttons**: `Montserrat`
    *   Weights: `500` (Medium), `600` (Semi-bold), `700` (Bold)
    *   Usage: Page titles, section headers, card titles, and primary button labels.
2.  **Body Text & Data**: `Inter` (or `Roboto`)
    *   Weights: `400` (Regular), `500` (Medium)
    *   Usage: Paragraphs, form inputs, time labels, standard informational text.

---

## 3. Color Palette (Light Mode)

The color palette is deliberately soft for the background to make interactive elements pop.

### Base Colors
-   **Background Base**: `#F5F5F7` (A soft, cool off-white for the main app background)
-   **Card / Surface**: `#FFFFFF` (Pure white for floating elements, cards, and modal sheets)
-   **Border / Divider**: `#E5E7EB` (Subtle gray for dividing sections without visual noise)

### Text Colors
-   **Text Primary**: `#111827` (Near-black for high-contrast readability on headings and primary body text)
-   **Text Secondary / Placeholder**: `#6B7280` (Medium gray for timestamps, secondary labels, disabled states)

### Semantic & Accent Colors
-   **Primary Accent**: `#2563EB` (Vibrant Blue, used for primary actions like "Submit", "Login", active tabs)
    *   *Hover/Active State*: Slightly darker (`#1D4ED8`)
-   **Success**: `#22C55E` (Green, for successful actions or Confirmed status)
-   **Danger / Destructive**: `#EF4444` (Red, for "Delete", "Reject", "Cancel", error states)
-   **Warning**: `#F59E0B` (Amber, for Override warnings or alerts)
-   **Info**: `#0EA5E9` (Light Blue, for informational badges)

### Status-Specific Colors (Booking States)
Booking states must be instantly recognizable on the timeline and Request Lists.

*   `CONFIRMED`: Displayed using the **User's Assigned Color block** (Solid fill, distinct text color for contrast if overlaid).
*   `REQUESTED`: Displayed with a **Dashed Border** using the User's assigned color and a very light/transparent colored background fill.
*   `REJECTED`: Removed from standard timelines. If shown in logs, use strikethrough text or the **Danger (`#EF4444`)** color.
*   `OVERRIDDEN`: Displayed as a **Greyed-out block** (`#9CA3AF`) with a subtle strikethrough or diagonal hatch pattern to indicate it is no longer active.
*   `CANCELLED`: Similar to Rejected; removed from the timeline, marked grey/strikethrough in logs.

### User Block Colors (Soft Palette for identifying users)
Assigned to users for visual differentiation on the calendar timeline.
-   `#3B82F6` (Blue)
-   `#10B981` (Emerald)
-   `#6366F1` (Indigo)
-   `#F97316` (Orange)
-   `#EC4899` (Pink)
-   `#14B8A6` (Teal)

*(Blocks use these as background colors, with white or primary text depending on contrast).*

---

## 4. Layout & Spacing System

-   **Grid / Spacing Rule**: Base-8 pixel scale (8px, 16px, 24px, 32px, etc.).
-   **Border Radius**:
    *   Buttons & Inputs: `12px`
    *   Cards & Slide-up Sheets: `16px` to `24px` (Very soft, pillowy corners)
-   **Shadows / Elevation**:
    *   Cards: Flat (`#FFFFFF` on `#F5F5F7` background) or very subtle shadow (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05)`).
    *   Floating Elements (Modals, FABs): Higher elevation (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)`).

---

## 5. Component Design Patterns

### 5.1 Top Navigation Bar
-   **Style**: Sticky, lightly translucent, and softly elevated. Use a subtle backdrop blur with a restrained bottom border so content can scroll beneath it without visual heaviness.
-   **Mobile**: Use a hamburger trigger on the left, keep the FleetTime brand visually centered, and move the navigation actions into a drawer so the header stays clean.
-   **Desktop / Tablet**: Keep low-emphasis ghost actions such as Log or Settings inline, retain a quiet user identity chip, and visually separate Logout as the destructive secondary action.

### 5.2 Buttons
-   **Primary Button**: Solid `Primary Accent` (`#2563EB`) background, white `Montserrat` text, `12px` rounded corners. Large tap target (min `48px` tall on mobile).
-   **Secondary Button**: Transparent background, `Text Primary` (`#111827`) text, `Border` (`#E5E7EB`) outline.
-   **Destructive Button**: Solid or outlines `Danger` (`#EF4444`).
-   **Ghost Button**: Borderless or near-borderless low-emphasis action used for shell navigation and supportive controls. It should gain background or text emphasis only on hover/focus.

### 5.3 Inputs & Forms
-   Clean, border-only inputs (`#E5E7EB` border), focusing changes border to `Primary Accent`.
-   Labels sit above inputs in `Text Secondary` (`#6B7280`).
-   No heavy backgrounds on input fields.
-   Placeholders must remain descriptive and neutral. Do not use example identities or values that look like already-entered content.

### 5.4 Loading & Empty States
-   **Loading**: A simple, modern spinner icon (e.g., SVG circular dash array that rotates) in `Primary Accent` color. *No skeleton blocks* to maintain the minimal aesthetic.
-   **Empty States**: An attractive, illustrative, but minimal outline icon (e.g., a stylized calendar, a sleeping car) sitting center-stage.
-   **Empty State Text**: Must be friendly and suggestive. Examples:
    *   *No Bookings*: "It's quiet here. Tap the '+' button to schedule your next drive."
    *   *No Vehicles*: "No rides available yet. Add a vehicle from the settings."

### 5.5 Modals vs. Slide-up Sheets (Adaptive Behavior)
-   **Mobile Screens (Width < 768px)**: Use **Bottom Slide-up Sheets**. These slide up from the bottom of the screen, have a drag-handle indicator at the top, and top-rounded corners (`24px`).
-   **Desktop/Tablet Screens (Width >= 768px)**: Use **Centered Modals**. A dialog box centered on the screen with a full-page dimmed, blurred backdrop so the page clearly falls behind the task in focus.
-   **Rendering**: Overlay surfaces should be portal-backed at the document level so they are not clipped by parent layout containers or stacking contexts.
-   **Admin Management Lists**: Members and Vehicles list views should stay compact and read-only by default. Editing, password reset, and delete controls belong inside these adaptive sheets/modals instead of rendering inline on every row.

### 5.6 Micro-Interactions & Feedback
-   **Toasts/Snackbars**: Temporary tiny popups at the bottom or top center for success/error messages (e.g., "Booking Confirmed ✅", "Conflict Overridden ⚠️"). They should slide in, pause for 3 seconds, and fade out.
-   **Button States**:
    *   *Hover*: Slight opacity drop (e.g., 90%) or color shift.
    *   *Active/Tap*: Slight scale down (`transform: scale(0.98)`) to feel tactile.
    *   *Disabled*: `50%` opacity, unclickable, cursor changes to `not-allowed`.

---

## 6. UI Page Specifications

### 6.1 Login Page
-   **Layout**: Centered content vertical and horizontal.
-   **Elements**: App Logo / Title ("FleetTime"), Name input, Password input, and a full-width Primary Login button.
-   **Copy**: Keep the page stripped down. Do not add explanatory paragraphs or field helper prose unless an error must be shown.
-   **Vibe**: Maximum whitespace, distraction-free, with optional subtle non-gradient shapes or texture to avoid an unfinished blank-screen feel.

### 6.2 Choose Vehicle Page
-   **Layout**: Grid (1 column on mobile, 2-3 on desktop).
-   **Cards**: Pure white cards for each vehicle.
-   **Content**: Silhouette/Minimalist icon based on vehicle type (Car, Van, Bike, SUV). Text showing vehicle name.
-   **Super Admin addition**: A highly visible gear/settings icon in the Top Bar.

### 6.3 Calendar Page
-   **Layout**: Month grid.
-   **Interaction**: Tapping a valid date opens the Booking UI.
-   **Indicators**: individual date cells *will* display tiny visual indicators (dots or colored bars on the bottom edge of the cell space) corresponding to the colors of users who have confirmed bookings that day. This provides at-at-a-glance availability without cluttering the number.
-   **Disabled States**: Past dates and dates beyond the `max_days_in_future` are greyed out (`Text Secondary` color) and unclickable.

### 6.4 The Booking UI (Timeline & Form)
This is the most complex screen. It features a "Swap" paradigm on mobile to maintain clarity without feeling cramped.

#### 6.4.1 Adaptive Layout Strategy
-   **Mobile (Swap View)**: A segmented control (or simple tab toggle) located near the top allows the user to snap between the **Timeline View** (seeing what is booked) and the **Form View** (entering details).
    *   *Recommendation*: Default to Timeline so the user can see free slots. A prominent "New Booking" Floating Action Button (FAB) or "Next" button flips them to the Form view.
-   **Desktop/Tablet (Side-by-side)**: Left panel is the vertical timeline; Right panel is the fixed form.

#### 6.4.2 Timeline View
-   Vertical scale from 00:00 to 23:59.
-   `30-minute` snap segments.
-   Blocks on the timeline show as solid colored rectangles (Confirmed) or dashed (Requested).
-   Current time indicator (a subtle red line) if looking at today.

#### 6.4.3 Form View
-   Inputs: Start Time, End Time, All-day Toggle, Reason (Textarea).
-   Submit Button: Reads "Book Trip" (if freedom=ON) or "Request Booking" (if freedom=OFF).

### 6.5 Log Page
-   **List View**: A chronologically ordered vertical list of actions.
-   **Card Style**: Each log entry is a simple horizontal row focused on Who, What, and When.
-   **Visuals**: Use the User's block color as a small dot or badge next to their name. Status or action badges may support the row, but the description should remain the primary readable signal.
-   **Interaction**: Do not expose raw snapshot JSON or snapshot-detail disclosure in the primary log experience.
-   **Filtering**: A sticky search/filter bar should sit below the page header so long log sessions keep filtering in reach.
-   **Time Hierarchy**: Row chrome should prioritize relative time for quick scanning, while the exact timestamp stays visible in the supporting metadata.

### 6.6 Super Admin: Request List & Settings
-   **Request List**: Rendered as dismissible cards. Each card clearly shows Who, What, When. Two prominent buttons per card: Approve (Success color) and Reject (Danger outline).
-   **Settings (Vehicles, Members, Privileges)**: Formally separated sections (via tabs or sub-pages) using standard form inputs (toggles for 'Freedom', numbers for 'Time Limit'). Keep the list layout compact on mobile and desktop for members/vehicles, with a dedicated `Manage` affordance that opens the adaptive sheet/modal.
-   **Overlay Copy**: Management overlays should use short section titles and essential confirmation copy only. Avoid filler explanations once the user is already in a focused edit/delete flow.

---
*End of UI Guideline.*
