# AI Agent Instructions: Staff/Manager/Admin Inquiries Management Page

## Objective
Create a dedicated internal inquiries management page for the staff, manager, and admin views. This page must follow the existing Capitol Booking System UI/UX, display inquiries received from the Messenger app/webhook flow, and allow authorized users to review, filter, update, and resolve each inquiry directly in the page.

## Scope
Implement a new internal page separate from the public customer-facing `/inquiries` form. The new page should be visible and accessible for:
- `front_of_house`
- `restaurant_manager`
- `system_admin`

It should not be exposed as a customer page.

## Required behaviors

### 1) Create a dedicated internal inquiries page
Add a new page, component, or route such as:
- `/inquiries/management`

Prefer a route that fits the current internal dashboard structure, e.g.:
- `/operations` with a tab/section for Inquiries, or
- a dedicated `/inquiries/management` route under internal access only

The route must be protected by the existing `RoleGuard` logic and the role access rules in `src/lib/roles.ts`.

### 2) Follow the existing system design language
Match the UI/UX patterns already used in the current application:
- use the same Capitol Restaurant branding and spacing
- follow the section layout used in `src/pages/Operations.tsx` and `src/pages/Dashboard.tsx`
- use cards, pills, table/list rows, filter controls, and toolbars consistent with staff dashboard pages
- reuse the existing `StatusPill`/status styling conventions when available
- use the same button, input, and form styling classes already used across the project
- maintain the existing light/dark, neutral, red-accent visual language

Do not create a completely different style or layout from scratch. Reuse the current design system rather than inventing a new UI pattern.

### 3) Display Messenger-originated inquiries
The page should show inquiries captured from the Messenger app / webhook integration, not only the local demo entries.

Data should be pulled from the same source used by the application for internal inquiries, ideally:
- Supabase `inquiries` table
- or the existing inquiry storage structure if that is the current backing source

Each inquiry row should display at minimum:
- inquiry ID
- customer name
- email
- inquiry type
- message content
- status
- submitted timestamp
- source (Messenger / Website / Other, if available)

If Messenger data includes fields beyond the current structure, include those values in the page when relevant, but do not break support for the existing form data.

### 4) Allow authorized users to modify the inquiries
The page must support direct modification by authorized staff/admin users.

At minimum, implement:
- status updates: `New`, `In progress`, `Resolved`
- filtering by status
- search by name, email, type, or message
- sort by newest first
- ability to open the inquiry details in a modal or detail panel
- ability to update or save the inquiry status
- optional note/comment field if the project already supports inquiry notes

The page should allow staff/managers/admins to confirm, process, or resolve inbound messages without leaving the system.

### 5) Use the current role access model
Update `src/lib/roles.ts` so the new page is permitted for:
- `front_of_house`
- `restaurant_manager`
- `system_admin`

Do not allow `customer` access to the internal inquiry management page.

The internal access rules should be placed alongside the existing operational pages and dashboard routes.

### 6) Add the page to navigation for internal users
Add the page to the internal staff navigation system in the header/navigation logic so it appears in the staff/manager/admin side navigation.

The nav item label should be clear and consistent with existing names, such as:
- Inquiries
- Manage Inquiries
- Staff Inquiries

The exact label may vary, but it must be intuitive and consistent with the rest of the dashboard UI.

### 7) Keep the customer-facing form separate
The public `/inquiries` page remains for customers to send inquiries.

Do not merge the internal inquiry manager with the public form. They are different responsibilities:
- public page = customer submission form
- internal page = staff/admin queue and management interface

### 8) Preserve data consistency
When updating inquiry status on the internal page:
- update local UI state immediately
- persist the new status to the main inquiry store or Supabase
- handle errors gracefully without breaking the page

If there is already a data refresh pattern in `Operations.tsx`, reuse it. Avoid duplicating broken or inconsistent logic.

## Technical requirements

### File locations to inspect first
Before editing, review the following files to match the current app patterns:
- `src/App.tsx`
- `src/lib/roles.ts`
- `src/pages/Operations.tsx`
- `src/pages/Dashboard.tsx`
- `src/data/inquiries.ts`
- `src/components/common/Header.tsx`

### Main implementation targets
Likely files to update:
- `src/App.tsx` — add route
- `src/lib/roles.ts` — add access permissions
- `src/components/common/Header.tsx` — add navigation link for internal users
- `src/pages/Operations.tsx` — possibly integrate inquiry management into existing operations page OR add a new page component
- new internal page file under `src/pages/`
- optional component folder under `src/components/operations/` for detail modal/table row components

### Existing app patterns to follow
Use current patterns from the project, especially:
- staff pages in `Operations.tsx`
- role-based route guards in `App.tsx`
- status pills and summary cards
- search/filter controls
- form and modal patterns used throughout the dashboard

## Acceptance criteria
The implementation is complete only if all items below are true:

1. A separate internal inquiries page exists for staff/manager/admin users.
2. The page is protected and is not accessible to customers.
3. The page displays inquiries from the Messenger/webhook data source.
4. The inquiry list includes customer details, type, message, status, and timestamp.
5. Authorized users can update inquiry status from the page.
6. Users can search/filter inquiries by relevant fields.
7. The UI matches the current system design and layout patterns.
8. The menu/header exposes the page to internal users in the staff/manager/admin side.
9. The public customer inquiries page remains intact and separate.

## Implementation notes
- Prioritize reuse over new abstractions.
- Keep the style consistent with the rest of the repository.
- Prefer minimal but complete changes.
- If a Messenger webhook or backend table is not fully wired yet, still implement the page to consume the existing inquiries data structure and make the integration points explicit.
- When there is an existing internal admin dashboard, prefer integrating into that rather than creating a disconnected page.

## Final output expectation
After implementation, the code should provide:
- a dedicated internal inquiries page,
- role-based access for staff/manager/admin,
- consistent UI/UX with the rest of the system,
- readable inquiry queue and modification controls,
- data sourced from Messenger/webhook inquiries rather than only the public form or demo data.

## Important reminder
Do not build a generic, unrelated admin page. This feature must feel like a native part of the Capitol Booking System operations dashboard and must work as an internal inquiry management workflow for staff, manager, and admin roles.
