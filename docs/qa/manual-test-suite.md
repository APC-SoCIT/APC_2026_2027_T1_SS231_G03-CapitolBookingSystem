# Capitol Booking System — Manual Test Suite

| | |
|---|---|
| **System under test** | https://capitolrestaurant.up.railway.app (Railway, `main`) |
| **Source of truth** | SRS v1.1 (10-6-2026). Cited as `REQ-*`, `§x.y`, and *BR Name* for the named business rules in §5.5 (the SRS does not number them). `—` means the case comes from the test brief or the app, not the SRS |
| **Code baseline** | `main` @ `010694c` |
| **Total run time** | about 2 h (Smoke 20 min · Feature cases 75 min · Role matrix 10 min · DB/Security 15 min) |
| **30-minute time box** | Run only the rows marked **⏱**, in this order: smoke ⏱ rows (about 17 min) → feature ⏱ rows CT-07, FR-02, FR-03, DO-05, IQ-04, IQ-05 (about 6 min) → RM-01 to RM-03 (about 3 min) → DB-01, DB-02 (about 2 min). One tester, the three core accounts, no day-before setup. Cases that need two users or a prepared Messenger thread are left to the full run |

Priorities: **P1** covers money and data paths (bookings, orders, inquiries, access control). **P2** covers polish, wording and secondary UX.
Findings (§5) are SRS-vs-app deviations to raise with the team, not test failures in the usual sense. A case that confirms a known finding should be logged as **Fail → F-xx**.

---

## 0. Before you start

### 0.1 Accounts (create in Supabase Auth, then set `profiles.role` in the Table Editor)

| Alias | Email (suggested) | `profiles.role` | `profiles.display_name` | Notes |
|---|---|---|---|---|
| **CUST** | `qa.customer@<your-domain>` | `customer` | `Juan dela Cruz` | Default role on signup. Don't edit it. |
| **CUST-B** | `qa.customer2@<your-domain>` | `customer` | `Maria Santos` | Needed only for the collision cases (FR-08, CT-09, DB-08) |
| **FOH** | `qa.foh@<your-domain>` | `front_of_house` | `QA Front Desk` | |
| **RIDER** | `qa.rider@<your-domain>` | `delivery_rider` | **`Jun Reyes`** | The rider page matches the rider record **by display name** (`DeliveryRider.tsx:27`). `Jun Reyes` is seeded rider `rider-01`. |

Give every account a password, because most steps use the **Log In** tab (email + password).
Optional accounts: `restaurant_manager` and `system_admin` are needed only for the matrix spot checks (RM-05, RM-06), DB-14 and OP-09.

### 0.2 Browsers
- **Browser A**: Chrome profile 1. Customer, staff and rider steps run here **in the same profile** (see finding **F-01**: delivery orders live in browser `localStorage`).
- **Browser B**: Chrome incognito or Firefox. Use it for second-user and cross-device checks.

### 0.3 Dates (rule: the earliest bookable day is **today + 2**)
The examples assume the run date is **Wed 2026-10-07**. If you run on another day, shift every date by the same offset.

| Name | Date | Use |
|---|---|---|
| D+1 | 2026-10-08 | Must be **blocked** |
| D+2 | 2026-10-09 | Earliest allowed (boundary) |
| BUF | 2026-10-21 | Buffet and packed bookings |
| FR | 2026-10-22 | Function room booking |
| COL | 2026-10-23 | Collision tests (use a fresh slot for every run) |

### 0.4 Test data
| Field | Valid | Invalid |
|---|---|---|
| Name | `Juan dela Cruz` | `J1`, `Jo` (fewer than 3 characters), `<script>x</script>` |
| PH mobile | `09171234567`, `0917 123 4567` | `0917123456` (10 digits), `08171234567`, `091712345678` (12 digits) |
| Email | `qa.customer@example.com` | `juan@`, `juan@example` |
| Address | `123 Taft Ave, Brgy 76, Pasay City` | blank / spaces only |

### 0.5 Tools for the DB/Security section
- Supabase **Project URL** and **anon key**: Dashboard → Project Settings → API. The anon key is public by design.
- **User JWT**: sign in on the site, then DevTools → Application → Local Storage → key `sb-<project-ref>-auth-token` → copy `access_token`.
- Shell variables used below: `SB=<project url>`, `ANON=<anon key>`, `JWT=<access token>`.

---

## 1. SMOKE SUITE (about 20 min, single tester, Browser A unless stated)

| # | ⏱ | Steps | Expected result |
|---|---|---|---|
| S-01 | ⏱ | In a repo checkout run `npm run test:roles` and then `npm run test:booking-time`. | Output shows `roles test passed: 99 checks` and `booking time test passed: 8 checks`. |
| S-02 | | Signed out, open `/`. Click header **Catering**, then **Function Rooms**, then **Delivery**. | Each page renders with no error banner. The header shows **Sign In / Log In**. |
| S-03 | ⏱ | Signed out, go to `/operations`. | Redirected to `/` (no staff UI flashes). |
| S-04 | ⏱ | Signed out, open `/delivery/order`. Click **Buttered Chicken**, add **Half** ×1, click **Done · 1 selected**, then click **Place order · ₱…**. | The **Sign In** modal opens. No order is created. |
| S-05 | ⏱ | In that modal click the **Log In** tab, enter CUST email and password, and submit. | The modal closes and you are signed in as *Juan dela Cruz*. The cart is kept and the **delivery details** modal opens automatically with the name prefilled. If it doesn't, click **Place order** again and log it as a P2 defect. |
| S-06 | ⏱ | Enter phone `09171234567` and the valid address. Payment: *Cash on delivery*. Click **Place order**. | The confirmation screen shows the tracking reference `CAP-1xxx`. Note it as **REF-D**. |
| S-07 | ⏱ | Go to `/catering/buffet`. Select **Package A**, click **Proceed →**, pick **BUF** at **12:00 PM** (Guests 10), and confirm. | The success panel shows **Booking Reference** `CAP-` followed by 16 characters. Note it as **REF-B**. |
| S-08 | | Go to `/catering/packed`. Add **Adobong Manok** (defaults to 10 packs), click **Proceed**, pick **BUF** at **1:00 PM**, and confirm. | Success with a `CAP-…` reference. The summary shows 10 packs, subtotal ₱1,200, **Delivery fee ₱0**, total ₱1,200. (Packed meals carry no fee in the app; delivery orders carry ₱60.) |
| S-09 | ⏱ | Go to `/function-rooms/reserve`. Fill Name, `09171234567`, email, Guests `20`, **Birthday Celebration**. Click **Check Availability →**, pick **FR** at **6:00 PM**, and confirm. | Success with reference **REF-F**. Slots before D+2 are disabled. |
| S-10 | ⏱ | Open `/profile`. | **My bookings** lists REF-B, the packed booking and REF-F, all **Pending**. The delivery tracker with REF-D shows **Preparing**. |
| S-11 | ⏱ | Go to `/inquiries`. Name `Juan dela Cruz`, email, Type **Catering**, Message `Do you cater on Sundays?`. Click Submit. | Success message *"Thank you for your inquiry."* plus an AI reply (or the fallback text). |
| S-12 | ⏱ | Log out (header → logout → confirm). Log in as **FOH**. | You land on `/operations`. Customer nav links are not shown. |
| S-13 | ⏱ | On `/operations`, find REF-F under **Function room bookings**. Open it, set Status **Confirmed**, click **Save changes**, then open the **Timeline** tab. | The row shows **Confirmed**. The timeline has a new *Confirmed* entry. *Function pending* drops by 1. |
| S-14 | | On `/operations`, find the S-11 inquiry in the **Inquiries** panel (wait up to 10 s). | The inquiry is listed (status *Resolved* because it was auto-answered; see F-07). |
| S-15 | ⏱ | Go to `/delivery/staff`. On REF-D set **Assign rider** = *Jun Reyes* and **Change status** = *Ready for pickup*. | Both changes save instantly. The Jun Reyes rider card shows 1 active delivery. |
| S-16 | | Go to `/inquiry-bot`. | The page loads with the **Needs reply** filter active, showing a list or *"No Messenger inquiries yet."* |
| S-17 | ⏱ | Log out. Log in as **RIDER**. | You land on `/delivery/rider`. The header shows *Jun Reyes*. REF-D appears with the **Start delivery** button. |
| S-18 | ⏱ | Click **Start delivery**, then **Mark delivered**. Then go to `/operations`. | Status goes *Out for delivery* → *Delivered*. `/operations` redirects back to `/delivery/rider`. (The SRS limits riders to setting *Delivered*; **Start delivery** is a known deviation → F-25.) |
| S-19 | | Log out. Log in as CUST, open `/profile`, and search REF-D in the tracker. | The tracker shows **Delivered** with all four steps complete. |
| S-20 | | `curl -s -o /dev/null -w '%{http_code}' 'https://capitolrestaurant.up.railway.app/inquiry-bot?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=42'` | `403` |

---

## 2. FEATURE TEST CASES

Legend: **⏱** marks the 30-minute subset. "BrA" and "BrB" mean Browser A and Browser B.

### 2.1 Auth and role-based access

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| AU-01 | Auth | Guest | New email never used | Header → **Sign In / Log In** → **Sign In** tab → enter `qa.new+1@<domain>` → **Email me a magic link** → open the email → click the link | Back on the site, signed in. A `profiles` row exists with `role = customer` and display name = email local-part | P1 | §5.3 Auth, REQ-ADM-001 |
| AU-02 | Auth | CUST | — | **Log In** tab → correct email + **wrong** password → submit | Inline error (*Invalid login credentials*), modal stays open, not signed in | P1 | §5.3 |
| AU-03 | Auth | Guest | Google account | **Sign In** tab → Google button → choose account | Redirected back to the original page, signed in as customer | P2 | §5.3 |
| AU-04 | Auth | Guest | — | **Log In** tab → blank email → submit. Then email `juan@` with any password | *"Enter your email address"*, then an inline error from Supabase. Not signed in | P2 | — |
| AU-05 | Auth | FOH | Signed out | Log In as FOH from `/catering` | Redirected to `/operations` (role home) | P1 | REQ-ADM-001 |
| AU-06 | Auth | RIDER | — | Log In as RIDER from `/` | Redirected to `/delivery/rider` | P1 | §2.3 Delivery Rider |
| AU-07 | Auth | CUST | Signed in | Header → logout icon → **Cancel**, then logout → confirm | Cancel keeps the session. Confirm signs out and navigates to `/`. Visiting `/profile` then shows *"Sign in to view and manage your profile details."* | P2 | — |
| AU-08 | Auth | any | Signed in | Hard-refresh (Ctrl+Shift+R) on a guarded page | *Loading account...* then the same page. No redirect flicker to `/` | P2 | — |
| AU-09 | Auth | Guest | — | Self-signup: confirm that metadata cannot grant a staff role (covered by `supabase/tests/roles_permissions.sql`). Manual alternative: sign up via magic link and read the `profiles.role` value | `role = customer` | P1 | REQ-ADM-001 |
| AU-10 | Auth | Throwaway user with no `profiles` row | Delete the throwaway user's `profiles` row (an invalid role can't be set because of the check constraint) | Log in as that user | *"Account access unavailable"* page, no data shown | P2 | REQ-ADM-001 |
| AU-11 | Auth | Guest | New email never used | List every self-service way to create an account (Sign In tab: magic link, Google). For each, check whether the account becomes usable only after the email is proven (link clicked / Google-verified). Then in Supabase → Authentication → Users, confirm the new user has `email_confirmed_at` set | Every self-signup path verifies the email before a session exists. No path creates a signed-in, unverified account | P1 | §5.3 (customers must verify via email) |

### 2.2 Catering (buffet packages and packed meals)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| CT-01 | Catering | Guest | Signed out | `/catering/buffet` → select **Package B** → **Proceed →** | Sign-in modal opens. Calendar does **not** open | P1 | §2.3 (sign-in required for booking) |
| CT-02 | Catering | CUST | — | `/catering/buffet` without selecting a package | **Proceed →** disabled; prompt *"Please select a package to continue."* | P2 | — |
| CT-03 | Catering | CUST | — | Buffet → Package A → Proceed → navigate the calendar to the current month | Today and D+1 are disabled. D+2 is enabled. Note *"Reservations must be made at least 2 days in advance."* | P1 | BR Lead Time |
| CT-04 | Catering | CUST | — | Buffet → Package A → Proceed → open the time dropdown | Exactly 22 options, **9:00 AM … 7:30 PM**, in 30-min steps. No 8:00 PM | P1 | — (brief: 09:00–19:30, 30-min slots) |
| CT-05 | Catering | CUST | — | Buffet modal: Guests `9`, then `13` → confirm | Validation error (*min. 10, max. 12*). Not submitted | P1 | — (package rule, catalog `minPax/maxPax`) |
| CT-06 | Catering | CUST | — | Buffet modal: Contact `0917123456` → confirm | Phone error. Not submitted | P1 | — |
| CT-07 ⏱ | Catering | CUST | — | `/catering/packed` → add **Lechon Kawali** → click **−** once (9 packs) | Error *"Each meal type requires at least 10 packs."*; **Proceed** disabled. Pressing **+** back to 10 re-enables it | P1 | — (packed-meal guideline) |
| CT-08 | Catering | CUST | — | Packed: add **Adobong Manok** and **Lechon Kawali** at 10 each | Subtotal ₱2,650 (10 × ₱120 + 10 × ₱145), Delivery fee ₱0, Total ₱2,650. The fee is hard-coded to 0 for packed meals (`CateringPacked.tsx:59`); the catalog fee of ₱60 applies only to delivery orders. Confirm with the PO that this is intended | P1 | — (packed-meal pricing) |
| CT-09 | Catering | CUST + CUST-B | Both on Buffet modal, BrA and BrB, same date **COL** | Both pick **10:00 AM**. CUST confirms first, then CUST-B confirms | CUST succeeds. CUST-B gets *"That time was just booked. Choose another available time."* and the 10:00 AM option becomes disabled | P1 | REQ-RES-002 (same mechanism), §4.2.2 step 5 |
| CT-10 | Catering | CUST | A buffet booking exists at BUF 12:00 PM | Packed booking at BUF **12:00 PM** | **Succeeds**: buffet and packed have separate slot inventories (`kind` is part of the unique key) | P2 | — (confirm the intended behavior with the PO) |
| CT-11 | Catering | CUST | — | Buffet modal → Name `<script>alert(1)</script>`. Then, on `/function-rooms/reserve`, put the same string in **Special Requests** and book. Open the booking as FOH | The name is rejected. Special Requests is saved and rendered as plain text in Operations (no alert) | P1 | §5.2 Input sanitization |
| CT-12 | Catering | CUST | Booking just created | Open `/profile` | The booking shows package, date/time, **Pending** and a timeline with *Pending* | P1 | — |

### 2.3 Function rooms

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| FR-01 | Function room | CUST | — | `/function-rooms/reserve` → leave every field blank → **Check Availability →** | Errors on Name, Contact, Email, Guests and Event Type. Calendar does not open | P1 | §5.4 Usability |
| FR-02 ⏱ | Function room | CUST | — | Guests **9** with all other fields valid → Check Availability | **SRS expects rejection (min 10).** The app **accepts** (min 1) → log **F-03** | P1 | BR Party Size |
| FR-03 ⏱ | Function room | CUST | — | Guests **31**, then **50** | **SRS expects 50 to be accepted.** The app rejects anything above 30 (*"This room holds up to 30 guests"*) → **F-03** | P1 | BR Party Size |
| FR-04 | Function room | CUST | — | Guests `10`, then `30` (boundaries) | Both accepted | P1 | BR Party Size |
| FR-05 | Function room | CUST | — | Open **Event Type** | Options: Birthday Celebration, Debut / 18th Birthday, Wedding Reception, Corporate Event, Family Reunion, Christmas Party, Seminar / Conference, Other | P2 | §5.4 |
| FR-06 | Function room | CUST | — | Contact `+639171234567` | Accepted (`CONTACT_REGEX` allows `+639`). Compare with DO-05 (delivery rejects it) → **F-19** | P2 | — |
| FR-07 | Function room | CUST | — | Valid form → calendar → try clicking **D+1** and then **D+2** at 9:00 AM | D+1 is not selectable. D+2 is bookable and succeeds | P1 | BR Lead Time |
| FR-08 | Function room | CUST + CUST-B | Both on the calendar for **COL**, BrA and BrB | Both pick **2:00 PM**. Confirm in A, then in B within 5 s | A succeeds. B gets *"That time was just booked…"*. **In B, without a refresh**, 2:00 PM is greyed out (Realtime) | P1 | REQ-RES-001, REQ-RES-002, §4.2.2-5 |
| FR-09 | Function room | CUST | All 22 slots of a date taken (do it on staging, or reuse the DB-08 script) | Open the calendar | That date is shown as reserved/disabled | P2 | REQ-RES-001 |
| FR-10 | Function room | CUST | — | Look for the deposit amount or a payment step before confirmation | **SRS:** deposit via payment gateway, slot locked for 10 min. **App:** none; the booking goes straight to *Pending* → **F-04 / F-05** | P1 | REQ-RES-003, REQ-RES-005 |
| FR-11 | Function room | FOH | Booking at COL 2:00 PM exists | `/operations` → open the booking → Status **Cancelled** → Save. As CUST-B, retry COL 2:00 PM | The slot is released and CUST-B's booking succeeds | P1 | REQ-RES-001, §4.2.2-5 |
| FR-12 | Function room | CUST | Booking confirmation email | Look for a cancellation link in email | **SRS:** self-cancel link up to 2 days before. **App:** no email or link → **F-06** | P1 | BR Cancellation, §3.3 SMTP |
| FR-13 | Function room | FOH | — | Look for a way to block out a date (maintenance) | **SRS:** manager blockout. **App:** `reserved_dates` is read-only in the UI; it can only be changed in the DB → **F-14** | P2 | REQ-RES-004 |
| FR-14 | Function room | CUST | — | Check the booking form for a privacy consent checkbox | **SRS:** explicit consent checkbox. **App:** none → **F-15** | P2 | §5.3 Data Privacy |
| FR-15 | Function room | CUST + FOH | — | Book any slot. Note the status shown on the success panel and in `/operations`. Look for a **duration** field on the form or calendar. Repeat FR-08 and read the collision message | **SRS:** the customer chooses a duration; the status is *Pending Deposit* until paid; collisions show *"Already Reserved"*. **App:** no duration (fixed slot); status *Pending*; message *"That time was just booked…"* → **F-28** | P2 | §4.2.2-1, -4, -5 |
| FR-16 | Function room | FOH | A past or same-day booking exists | `/operations` → open the booking → look for a way to mark it *Late cancellation* or *No-show* | **SRS:** staff can flag late cancellations and no-shows. **App:** the status list is Pending / Confirmed / Completed / Cancelled; there is no late-cancellation or no-show flag → **F-29** | P2 | BR Cancellation |

### 2.4 Delivery (customer)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| DO-01 | Delivery | Guest | — | `/delivery/order` → category chips **All**, **Chicken**, **Pancit sa Bilao** | Items filter by category. Bilao items appear as one card per group (e.g. *Bihon Bilao*) | P1 | REQ-DEL-001 |
| DO-02 | Delivery | CUST | — | Click **Bihon Bilao** → variant modal → add **XS (3–5 pax)** ×1 and **Large (18–20 pax)** ×2 → **Done · 3 selected** | Cart has 2 lines: ₱430 ×1 and ₱950 ×2. Subtotal ₱2,330 + ₱60 fee = **₱2,390** | P1 | REQ-DEL-002 |
| DO-03 | Delivery | CUST | — | **Fried Chicken** → **Half** / **Whole** picker | Both variants are listed with their own prices. **Done** is disabled until quantity ≥ 1 | P2 | REQ-DEL-001 |
| DO-04 | Delivery | CUST | — | Increase one item up to the max | **+** disables at **20** (`MAX_QUANTITY_PER_ITEM`) | P2 | REQ-DEL-002 |
| DO-05 ⏱ | Delivery | CUST | Cart not empty | Details modal: phone `0917123456`, then `08171234567`, then `+639171234567` | Each one is rejected with *"Enter an 11-digit number starting with 09"* | P1 | — |
| DO-06 | Delivery | CUST | — | Details: address `"   "` | *"Delivery address is required"* | P1 | §4.3.2-2 |
| DO-07 | Delivery | CUST | Cart empty | Click **Place order** | *"Select at least one item to order"*; no modal | P2 | — |
| DO-08 | Delivery | CUST | — | Place a valid order. Note the reference. Then open BrB, log in as CUST, go to `/profile` and search the same reference | **SRS expects the order to be visible on any device.** The app shows *"We could not find that reference."* in BrB → **F-01** | P1 | REQ-DEL-004 |
| DO-09 | Delivery | CUST + CUST-B | Two different browsers, both with clean storage | Each places one order | **Expected:** unique references. **App:** both get the same `CAP-10xx` (client-side counter) → **F-02** | P1 | REQ-DEL-004 |
| DO-10 | Delivery | CUST | — | Payment method options | *Cash on delivery / GCash / Card*. No gateway step happens for GCash or Card, and the SRS names **PayMaya**, which the app does not offer → **F-04** | P1 | REQ-DEL-003 |
| DO-11 | Delivery | CUST | Order placed | Confirmation → **Track this order** | Opens `/profile?reference=CAP-…` with the order prefilled and status *Preparing* | P2 | REQ-DEL-004 |
| DO-12 | Delivery | CUST | — | Search the menu for `zzz` | Empty state, no crash | P2 | — |
| DO-13 | Delivery | Guest | — | `/delivery/order` → open 3 items from different categories (e.g. **Buttered Chicken**, **Bihon Bilao**, a Kabayo item) | Each shows a category, a price and a description. Photos: items without one show the *"No image available"* placeholder (count them). **SRS:** allergen/dietary tags. **App:** none → **F-23** | P2 | REQ-DEL-001 |
| DO-14 | Delivery | CUST | Cart has 2 different items | Look for a per-item note (e.g. "no onions" on one dish). Then open the details modal and use **Notes (optional)** | **SRS:** customisation notes per item. **App:** only one order-level *Notes* field; it is saved with the order and shown to staff in the order detail → **F-24** (partial) | P2 | REQ-DEL-002, §4.3.2-1 |

### 2.5 Delivery staff (menu manager, order status, rider workspace)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| DS-01 | Delivery staff | FOH | Order REF-D in BrA | `/delivery/staff` → status chips → **Preparing** | The list filters, and counts match | P1 | REQ-DEL-004, REQ-ADM-002 |
| DS-02 | Delivery staff | FOH | — | REF-D → **Change status** → *Out for delivery*. Then, as CUST in the same browser, open the profile tracker | The tracker shows *Out for delivery* | P1 | REQ-DEL-004 |
| DS-03 | Delivery staff | FOH | — | Add rider: name `Jun Reyes` (duplicate) | *"A rider with this name already exists"* | P2 | — |
| DS-04 | Delivery staff | FOH | — | Add rider `Ana Lim` / `09181112222` → assign her to an order → delete her | The order shows *Unassigned* again | P2 | — |
| DS-05 | Delivery staff | FOH | — | `/delivery/items` → **Manage categories** → hide **Kabayo** → open `/delivery/order` as CUST in the same browser | Kabayo items are hidden from the customer menu | P1 | REQ-ADM-003 |
| DS-06 | Delivery staff | FOH | DS-05 done | Open `/delivery/order` in **BrB** | **SRS expects the change on the public storefront.** Kabayo is still visible in BrB (`localStorage` only) → **F-09** | P1 | REQ-ADM-003, §4.4.2-4 |
| DS-07 | Delivery staff | FOH | — | **Add item** `QA Pancit` / price `0` | Validation rejects the price | P2 | REQ-ADM-003 |
| DS-08 | Delivery staff | FOH | — | Open `/delivery/items` as **FOH** | **SRS:** only Manager and Admin may change menu and prices. **App:** FOH has full edit access → **F-08** | P1 | BR Menu & Pricing Authority |
| DS-09 | Rider | RIDER | Order assigned to Jun Reyes, status *Preparing* | `/delivery/rider` | The order is listed with **no action button** (rider actions start at *Ready for pickup*) | P1 | §2.3 Rider |
| DS-10 | Rider | RIDER | — | Status filter chips | The counts for *Out for delivery* and *Delivered* match the list | P2 | — |
| DS-11 | Rider | RIDER (display name **not** a rider record, e.g. `QA Rider`) | — | Open `/delivery/rider` | **Expected:** "No rider record assigned". **App:** falls back to the first rider (Jun Reyes) and shows their orders → **F-13** | P1 | §2.3 (assigned orders only) |
| DS-12 | Rider | RIDER | No orders assigned | Open the page | An empty state is shown, not an error | P2 | — |
| DS-13 | Rider | RIDER | Order assigned to Jun Reyes, status *Ready for pickup* | `/delivery/rider` → list the actions offered | **SRS:** the rider may only set *Delivered*. **App:** the rider can also move *Ready for pickup* → *Out for delivery* (**Start delivery**) → **F-25** | P2 | §2.3 Delivery Rider |
| DS-14 | Delivery staff | FOH | `/delivery/staff` open in BrA with sound on | In another tab of BrA (same profile, see F-01), CUST places a new order. Return to the staff tab | **SRS:** an audible chime plus the new order docket, without a refresh. **App:** no sound, and the order appears only after a manual reload (no polling or storage listener on `/delivery/staff`) → **F-26** | P2 | §4.3.2-4, §3.1 alerts |

### 2.6 Inquiries (web form → webhook → Supabase → Operations)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| IQ-01 | Inquiries | Guest (signed out) | — | `/inquiries` → submit a valid General Question | **SRS:** sign-in required (REQ-INQ-001). **App:** accepted from a guest, `user_id = null` → **F-07** | P1 | REQ-INQ-001, §2.3 |
| IQ-02 | Inquiries | CUST | — | Submit with an empty Message | Browser `required` validation blocks the submit | P2 | REQ-INQ-001 |
| IQ-03 | Inquiries | CUST | — | Run `curl -X POST $SITE/inquiries -H 'Content-Type: application/json' -d '{"name":"a","email":"bad","type":"x","message":"y"}'` | HTTP **400** *"Please provide a valid name, email, inquiry type, and message."* | P1 | — |
| IQ-04 ⏱ | Inquiries | CUST | — | Type **Delivery**, message `I would like to order 20 packs of Adobong Manok for Friday` | Success *"Your request was sent to our staff."*. The DB row has `type = Manual Order Request`, `status = New` | P1 | REQ-INQ-001, §4.1.2-2 |
| IQ-05 ⏱ | Inquiries | FOH | IQ-04 done | `/operations` → Inquiries panel (wait ≤ 10 s, no refresh) | The row appears with the **Manual reply needed** badge. *New inquiries* is incremented. (Arrives by 10-s polling; the SRS asks for push → F-27) | P1 | REQ-ADM-002, §3.1 alerts, §3.4 |
| IQ-06 | Inquiries | FOH | IQ-05 | Set the status → **In progress**, then **Resolved**. Refresh the page | The status persists after the refresh. The badge disappears after leaving *New* | P1 | REQ-INQ-004, §4.1.2-5 |
| IQ-07 | Inquiries | CUST | — | Informational inquiry `What time do you open?` | Reply shown in about 30 s or less. The DB row status is **Resolved** immediately. **SRS** says it is created as *New* → **F-07** | P2 | §4.1.2-2/3 |
| IQ-08 | Inquiries | FOH | No inquiries (staging) | Open the Inquiries panel | Empty state text, no spinner stuck | P2 | — |

### 2.7 Inquiry Bot (staff, `/inquiry-bot`)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| IB-01 | Inquiry Bot | FOH | ≥ 1 Messenger question the bot could not answer (send `Do you have halal certification?` to the Page from a test FB account) | Open `/inquiry-bot` | The item appears under **Needs reply** (type *Unanswered Question*, status *New*) within 10 s | P1 | REQ-INQ-002 |
| IB-02 | Inquiry Bot | FOH | — | Chips **Needs reply / Requests / Resolved / All**, plus the type dropdown | Counts on the chips match the lists. Type filter narrows further. *"No inquiries match these filters."* when empty | P2 | — |
| IB-03 | Inquiry Bot | FOH | — | Search `halal` | Only matching cards remain | P2 | — |
| IB-04 | Inquiry Bot | FOH | IB-01, within 24 h of the customer's message | **Reply on Messenger** → type `Yes, we are halal-friendly. — Capitol` → Send | Success banner. The test FB account receives the message. The card becomes **Resolved** with the reply text and time. The button now reads **Reply again** | P1 | REQ-INQ-004 |
| IB-05 | Inquiry Bot | FOH | A Messenger inquiry whose customer last wrote **more than 24 h ago** (prepare one the day before) | Reply on Messenger → Send | Error banner *"Messenger did not accept the reply. Facebook only allows Page replies within 24 hours…"*. Status is **unchanged** | P1 | REQ-INQ-004 |
| IB-06 | Inquiry Bot | FOH | New inquiry | **Mark in progress** → **Mark resolved** → **Reopen** | New → In progress → Resolved → In progress. Each change persists after a refresh | P1 | REQ-INQ-004 |
| IB-07 | Inquiry Bot | FOH | — | Open the reply modal with an empty text | **Send** disabled | P2 | — |
| IB-08 | Inquiry Bot | FOH | — | Look for the AI-drafted reply next to the inquiry | **SRS:** AI draft shown and editable before sending. **App:** no draft; staff types from scratch → **F-10** | P1 | REQ-INQ-003 |
| IB-09 | Inquiry Bot | — | — | `curl -X PATCH $SITE/inquiries/<id>/status -H 'Content-Type: application/json' -d '{"status":"Resolved"}'` (no token), then repeat with a **CUST** JWT in `Authorization: Bearer` | `401 Sign in required.`, then `403 Only staff, managers, or admins…` | P1 | REQ-ADM-001 |

### 2.8 Messenger AI agent (webhook)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| MA-01 | Messenger | — | VERIFY_TOKEN from Railway variables | `curl '$SITE/inquiry-bot?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=4242'` | `200`, body `4242` | P1 | REQ-INQ-002 |
| MA-02 | Messenger | — | — | Same with the wrong token / no `hub.mode` | `403` / the SPA HTML (staff page) | P1 | REQ-INQ-002 |
| MA-03 | Messenger | Test FB user | — | Send `hi` to the Page | Greeting plus **quick replies**: *Function Room*, *Catering*, *Delivery* | P1 | §4.1.2-3 (ack ≤ 30 s) |
| MA-04 | Messenger | Test FB user | MA-03 | Tap **Catering** → reply with the requested details (name, `09171234567`, event, date, guests, package) | The bot confirms the request. A row appears on `/inquiry-bot` under **Requests** with type *Catering*. `messenger_sessions` holds the PSID with a `state`/`draft` while the form is in progress | P1 | REQ-INQ-002 |
| MA-05 | Messenger | Test FB user | — | Send `What is the capital of France?` | Off-topic message. **No** inquiry row is created | P2 | — |
| MA-06 | Messenger | Test FB user | — | Ask something not in the known facts (`Do you accept pets?`) | Handover message (*"Our staff will review…"*). The row type is *Unanswered Question*, status *New* | P1 | REQ-INQ-002, §4.1.2-4 |
| MA-07 | Messenger | Test FB user | — | Send `I want to order 2 Buttered Chicken` | The bot says it cannot take orders in chat and links the website. **No** `delivery_orders` row (`source = messenger`) is created. This differs from the brief, which expects Messenger orders → **F-11** | P1 | — (brief vs app) |
| MA-08 | Messenger | Test FB user | — | Send a sticker/photo | *"I can only read text…"* | P2 | — |
| MA-09 | Messenger | Test FB user | — | Send 3 messages within 2 s | Replies come in order, and no draft is lost (per-sender queue) | P2 | — |

### 2.9 Profile

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| PR-01 | Profile | Guest | — | Open `/profile` | *"Sign in to view and manage your profile details."* plus a sign-in button. No data | P1 | §5.3 |
| PR-02 | Profile | CUST | — | Contact details → phone `0917` → Save | Phone validation error. Not saved | P2 | — |
| PR-03 | Profile | CUST | — | Save phone `09171234567` and a Home address. Then open the function room form | Contact prefilled with `09171234567` | P2 | §5.4 Usability |
| PR-04 | Profile | CUST | CUST-B has bookings | Log in as CUST → **My bookings** | Only CUST's own bookings are listed | P1 | §5.3, REQ-ADM-001 |
| PR-05 | Profile | CUST | New account | **My bookings** | Empty state message, no error | P2 | — |
| PR-06 | Profile | CUST | Order *Out for delivery* | Tracker → enter the reference → view the map | The map renders the restaurant and the address pin, with a *≈ N min drive* estimate (or a graceful fallback if geocoding fails) | P2 | REQ-DEL-004 |
| PR-07 | Profile | CUST | — | Tracker → reference `CAP-9999` | *"We could not find that reference."* | P2 | REQ-DEL-004 |

### 2.10 Operations dashboard

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| OP-01 | Operations | FOH | `/operations` open in BrA | In BrB, CUST books a buffet slot | A new row appears in **Catering bookings** in BrA **without a refresh**. *Catering pending* +1 | P1 | REQ-ADM-002, §3.4 |
| OP-02 | Operations | FOH | — | Open a function booking → Status Pending → **Confirmed** → Save → **Timeline** tab | The timeline appends *Confirmed* with a timestamp. The customer's profile shows it after a refresh | P1 | §4.2.2-4, REQ-ADM-002 |
| OP-03 | Operations | FOH ×2 | Same booking open in BrA and BrB (both FOH) | Save a change in A, then try to save in B | B shows the *"booking changed in another session"* error. **Save changes** is disabled until reload | P1 | REQ-RES-002 |
| OP-04 | Operations | FOH | Two bookings: X at COL 3:00 PM, Y at COL 3:30 PM | Edit Y → time 3:00 PM → Save | Rejected with the slot-taken error. Y is unchanged | P1 | REQ-RES-002 |
| OP-05 | Operations | FOH | — | Open a booking → no changes | **Save changes** disabled | P2 | — |
| OP-06 | Operations | FOH | — | Search function bookings by reference / name | Filtering works. Empty state when there are no matches | P2 | — |
| OP-07 | Operations | FOH | Booking *Cancelled* | Set it back to **Pending** while its slot is free | Allowed. The slot is re-occupied (the calendar shows it as taken) | P2 | REQ-RES-001 |
| OP-08 | Operations | FOH | — | Stat cards: *Active deliveries, Function pending, Catering pending, New inquiries, Total orders* | Counts match the tables below them. **SRS** widgets are *Today's Deliveries, Room Occupancy, Pending Inquiries, Revenue Summary*. The app has no room occupancy, and revenue appears only as a hint under *Total orders* → **F-30** | P2 | REQ-ADM-002, §4.4.2-3 |
| OP-09 | Reporting | Manager *(optional account)* or Admin | Some bookings and orders exist | `/dashboard` → look for daily/monthly summaries of sales volume, direct vs. third-party breakdown and room utilisation, and an **Export** (CSV/PDF) action | **SRS:** exportable daily/monthly reports. **App:** charts only (*Orders by Source*, *Service Breakdown by Source*, *Order Volume Over Time*, *Inquiry Tracking*). The source split partly covers direct vs. third-party, but there is no sales-value report, no room utilisation and no export → **F-22** | P1 | REQ-ADM-004 |

### 2.11 Non-functional (quick checks)

| ID | Feature | Role | Precondition | Steps | Expected | Pri | SRS ref |
|---|---|---|---|---|---|---|---|
| NF-01 | Performance | Guest | Chrome DevTools → Network → throttling **Fast 4G**, cache disabled | Load `/`, `/delivery/order` and `/function-rooms/reserve`. Read **Load** at the bottom of the Network panel | Each loads in **≤ 5 s** | P2 | §5.1 Response Time |
| NF-02 | Performance | CUST | Same throttling | Function room form → **Check Availability →**, time until the calendar shows slot states. Then **Confirm**, time until the success panel | Each **< 5 s** | P2 | §5.1 Transaction Speed |
| NF-03 | Usability | Guest | DevTools device toolbar, width **375 px** | Walk through S-07 and S-09 on the 375 px viewport | No horizontal scroll, every control is reachable, and the function room booking takes no more than the 8 steps listed in §5.4 | P2 | §3.1 Responsive Layout, §5.4 Usability |

---

## 3. ROLE-ACCESS MATRIX

Source: `src/lib/roles.ts` → `canAccessRoute`, asserted by `scripts/test-roles.ts` (99 checks, passing at `010694c`).
**✅** = page renders. **↪ X** = `RoleGuard` redirects to the role home **X**. Unknown paths are denied by the guard first, so they redirect to the role home (`/` for guests and customers).

"Customer pages" = `/`, `/about-us`, `/catering`, `/catering/buffet`, `/catering/packed`, `/function-rooms`, `/function-rooms/reserve`, `/inquiries`, `/delivery`, `/delivery/order`.

| Route | Guest (signed out) | customer | front_of_house | restaurant_manager | system_admin | delivery_rider | no valid role |
|---|---|---|---|---|---|---|---|
| Customer pages | ✅ | ✅ | ↪ `/operations` | ↪ `/operations` | ↪ `/dashboard` | ↪ `/delivery/rider` | "Account access unavailable" |
| `/profile` | ✅ (sign-in prompt) | ✅ | ↪ `/operations` | ↪ `/operations` | ↪ `/dashboard` | ↪ `/delivery/rider` | unavailable |
| `/operations` | ↪ `/` | ↪ `/` | ✅ | ✅ | ✅ | ↪ `/delivery/rider` | unavailable |
| `/delivery/staff` | ↪ `/` | ↪ `/` | ✅ | ✅ | ✅ | ↪ `/delivery/rider` | unavailable |
| `/delivery/items` | ↪ `/` | ↪ `/` | ✅ ⚠ F-08 | ✅ | ✅ | ↪ `/delivery/rider` | unavailable |
| `/inquiry-bot` | ↪ `/` | ↪ `/` | ✅ | ✅ | ✅ | ↪ `/delivery/rider` | unavailable |
| `/dashboard` | ↪ `/` | ↪ `/` | ↪ `/operations` | ✅ | ✅ | ↪ `/delivery/rider` | unavailable |
| `/delivery/rider` | ↪ `/` | ↪ `/` | ↪ `/operations` | ↪ `/operations` | ✅ | ✅ | unavailable |
| Login lands on | — | stays on the current page | `/operations` | `/operations` | `/dashboard` | `/delivery/rider` | — |

Manual spot checks (about 10 min; the automated test covers the logic, these confirm the wiring in the deployed build):

| ID | ⏱ | Role | Steps | Expected |
|---|---|---|---|---|
| RM-01 | ⏱ | CUST | Type `/delivery/staff`, `/inquiry-bot` and `/dashboard` in the address bar | Each redirects to `/` |
| RM-02 | ⏱ | FOH | Type `/dashboard`, `/delivery/rider`, `/` and `/profile` | All redirect to `/operations` |
| RM-03 | ⏱ | RIDER | Type `/operations`, `/delivery/items` and `/catering` | All redirect to `/delivery/rider` |
| RM-04 | | FOH | Type `/OPERATIONS/` (case and trailing slash) | Renders Operations (paths are normalised) |
| RM-05 | | Manager *(optional account)* | Open `/dashboard` | Renders. `/delivery/rider` redirects to `/operations` |
| RM-06 | | Admin *(optional account)* | Open `/delivery/rider` | Renders. `/` redirects to `/dashboard` |

> The UI guard is only a convenience. Real enforcement is RLS (section 4) and `requireStaffAuth` in `webhook.js`.

---

## 4. DB / SECURITY QUICK CHECKS (about 15 min)

Run these against **staging** if you have it. On production, use the dates in COL and clean up the rows afterwards.
Base headers: `-H "apikey: $ANON" -H "Authorization: Bearer $JWT"` (for anon, use `$ANON` as the bearer).

### 4.1 Expected RLS per role (from migrations `20260827090541`, `20260917082142`, `20260925143550`)

| Table | anon | customer | front_of_house / restaurant_manager | system_admin | delivery_rider |
|---|---|---|---|---|---|
| `function_bookings`, `catering_bookings`, `delivery_orders`, `inquiries` | no access | read, insert, update and delete **own rows only** (`user_id = auth.uid()`). Customers may also insert inquiries with `user_id = null` | read **all**, write **all** | read **all**, **no write** ⚠ | no access |
| `catering_packages`, `packed_menu_items`, `function_rooms`, `reserved_dates` | read | read | read + write ⚠ F-08 | read | read |
| `settings` | read | read | read + update | read | read |
| `booking_availability` | read | read | read | read | read |
| `profiles` | none | read own row | read own row | read own row | read own row |
| `messenger_sessions` | none | none | none | none | none (service role only) |

### 4.2 Checks

| ID | ⏱ | Check | Command / steps | Expected | Pri |
|---|---|---|---|---|---|
| DB-01 | ⏱ | Anon cannot read bookings | `curl "$SB/rest/v1/function_bookings?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"` | `401/403` *permission denied* (or `[]`). **Never** rows | P1 |
| DB-02 | ⏱ | Anon cannot write business tables | `curl -X POST "$SB/rest/v1/inquiries" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H 'Content-Type: application/json' -d '{"name":"x","type":"x","message":"x","status":"New"}'` (repeat for `catering_bookings` and `delivery_orders`) | `401` / `42501 permission denied` | P1 |
| DB-03 | | Anon can read slot inventory but not write it | GET `booking_availability?select=*&limit=1` → then POST a row | GET `200`. POST denied | P1 |
| DB-04 | | Customer sees only own rows | With CUST JWT: `GET function_bookings?select=id,user_id` | Every row has `user_id` = CUST's id. CUST-B's bookings are absent | P1 |
| DB-05 | | Customer cannot write another user's row | CUST JWT: `PATCH function_bookings?id=eq.<CUST-B booking id>` body `{"status":"Cancelled"}` with `Prefer: return=representation` | `[]` (0 rows affected) | P1 |
| DB-06 | | **Customer self-confirm** | CUST JWT: `PATCH function_bookings?id=eq.<own Pending id>` body `{"status":"Confirmed"}` | **Expected (business):** denied. **Current policy allows it** (update-own has no column/status restriction) → **F-12** | P1 |
| DB-07 | | Customer cannot escalate role | CUST JWT: `PATCH profiles?id=eq.<own id>` body `{"role":"system_admin"}` | `403` / permission denied (no UPDATE grant on `profiles`) | P1 |
| DB-08 | | Atomic slot reservation | Fire two POSTs for the **same** `room_id=private_dining`, `date=COL`, `time=16:00`, `status=Pending` concurrently (two shells, CUST and CUST-B JWTs, `&` and then `wait`) | Exactly one `201`. The other returns `409` / `23505 function_bookings_active_slot_unique`. `booking_availability` has exactly one row for that slot. (The outcome meets REQ-RES-002, but the mechanism is a unique index, not `SELECT FOR UPDATE` → F-31) | P1 |
| DB-09 | | Off-grid / out-of-hours times rejected by the DB | POST a function booking with `time = 20:00`, then `12:15` | `23514` check violation (`function_bookings_time_grid_check`) | P1 |
| DB-10 | | Lead time enforced server-side | CUST JWT: POST a function booking for **today** at 10:00 | **Expected:** rejected (BR Lead Time). **Current:** the DB accepts it (the 2-day rule is client-only) → **F-16** | P1 |
| DB-11 | | Cancel releases the slot | FOH: set the DB-08 booking to `Cancelled` → query `booking_availability` for that slot | Row gone. A new booking for the slot succeeds | P1 |
| DB-12 | | Staff read all inquiries | FOH JWT: `GET inquiries?select=id,user_id&limit=50` | Includes rows with `user_id = null` and rows from other users | P1 |
| DB-13 | | Rider has no business-table access | RIDER JWT: `GET delivery_orders?select=reference` | `[]` (no read policy for the rider role) | P2 |
| DB-14 | | system_admin write path | Admin JWT: `PATCH inquiries?id=eq.<id>` body `{"status":"Resolved"}` | **Current:** 0 rows, so the Operations UI change silently reverts on refresh. **SRS expects** full admin access → **F-17** | P2 |
| DB-15 | | Webhook POST not authenticated | `curl -X POST $SITE/inquiry-bot -H 'Content-Type: application/json' -d '{"object":"page","entry":[]}'` | **Expected:** reject requests without `X-Hub-Signature-256`. **Current:** `200 EVENT_RECEIVED` → **F-18** | P1 |
| DB-16 | | Host / origin guard | `curl -H 'Origin: https://evil.example' -X POST $SITE/inquiries ...` | `403 This website origin is not allowed.` | P2 |

---

## 5. FINDINGS: SRS vs. app (verified in code at `010694c`; confirm on the live site with the referenced test)

| ID | Severity | Finding | Evidence | SRS ref | Test |
|---|---|---|---|---|---|
| **F-01** | P1 | Web delivery orders are stored only in the browser's `localStorage`, not in Supabase `delivery_orders`. Staff, riders and customers on other devices never see them | `src/data/delivery.ts:200-216`, `DeliveryOrder.tsx:252-280`; no `delivery_orders` query anywhere in `src/` | REQ-DEL-004, REQ-ADM-002 | DO-08 |
| **F-02** | P1 | The order reference is `CAP-${1050 + local order count}`, generated client-side, so duplicates across devices are possible. The DB function `next_delivery_reference()` is unused | `DeliveryOrder.tsx:253` | REQ-DEL-004 | DO-09 |
| **F-03** | P1 | Function room accepts 1–30 guests. The SRS says 10–50 | `FunctionRoomReservation.tsx:76-80`, `maxPax={30}` | BR Party Size | FR-02/03 |
| **F-04** | P1 | No payment gateway or deposit: bookings are created as *Pending* with no payment, and the GCash/Card options are labels only. PayMaya (REQ-DEL-003) is not offered | `reservations.ts:155`, `DeliveryOrder.tsx:893` | REQ-RES-003, REQ-DEL-003 | FR-10, DO-10 |
| **F-05** | P1 | No 10-minute slot hold or expiry. The slot is occupied as soon as the booking is *Pending* and stays occupied until staff cancel it | No hold logic in the migrations or `src/` | REQ-RES-005 | FR-10 |
| **F-06** | P1 | No confirmation email or self-cancel link | No SMTP/Resend code | BR Cancellation, §3.3 | FR-12 |
| **F-07** | P1 | The web inquiry form does not require sign-in, the server always saves `user_id = null` (even for a signed-in customer, so the inquiry is never linked to the account), and non-order inquiries are saved as *Resolved* instead of *New* | `Inquiries.tsx`, `webhook.js:820-828` | REQ-INQ-001, §4.1.2-2 | IQ-01, IQ-07 |
| **F-08** | P1 | Front-of-house can edit the menu (`/delivery/items`), and catalog RLS gives FOH write access to packages, items, rooms and blackout dates | `roles.ts` OPERATIONS_PATHS; migration `20260917082142` `operational_predicate` | BR Menu & Pricing Authority | DS-08 |
| **F-09** | P1 | Menu manager edits (items, categories, visibility) are stored in `localStorage` only, so they are not persisted to the DB or shown to other customers | `src/data/deliveryMenu.ts` | REQ-ADM-003, §4.4.2-4 | DS-06 |
| **F-10** | P1 | The Inquiry Bot page shows no AI-drafted reply for staff to edit | `InquiryBot.tsx` (no draft field) | REQ-INQ-003 | IB-08 |
| **F-11** | P1 (brief) | The Messenger agent never creates orders (`place_order` → "we can't take orders here"), so no `source = messenger` rows are written, although the schema supports them | `webhook.js:525`, `:950-953` | — (the test brief expects it; the SRS does not require it) | MA-07 |
| **F-12** | P1 | Customer RLS allows updating any column of their own booking or order, including `status` (e.g., self-*Confirmed*) | Migration `20260917082142` update policy | REQ-RES-003, §5.3 | DB-06 |
| **F-13** | P1 | A rider account whose display name doesn't match a rider record sees the **first** rider's orders | `DeliveryRider.tsx:26-34` | §2.3 Rider ("assigned orders") | DS-11 |
| **F-14** | P2 | There is no UI for managers to block out dates; `reserved_dates` can only be edited in the DB | No write to `reserved_dates` in `src/` | REQ-RES-004 | FR-13 |
| **F-15** | P2 | The booking form has no data-privacy consent checkbox | No "consent" in `src/` | §5.3 Data Privacy | FR-14 |
| **F-16** | P1 | The 2-day lead time is enforced only in the client. The DB accepts same-day bookings | `CalendarModal.tsx:201-209`; no DB check | BR Lead Time | DB-10 |
| **F-17** | P2 | system_admin can open Operations but RLS denies writes, so status changes fail or silently revert | Migration `20260917082142` (`operational_predicate` excludes system_admin) | §2.3 (Administrator: full access), REQ-ADM-001 | DB-14 |
| **F-18** | P1 | `POST /inquiry-bot` has no Meta signature check, and `VERIFY_TOKEN` falls back to `test-agent` when the env var is unset | `webhook.js:75`, `:975` | §5.3, §2.5 Vendor | DB-15 |
| **F-19** | P2 | Phone rules differ between forms: function room and catering accept `+639…`, delivery and profile accept only `09…` | `FunctionRoomReservation.tsx:16` vs `DeliveryOrder.tsx:46` | — (internal consistency) | FR-06, DO-05 |
| **F-20** | P2 | The delivery status flow differs: the SRS has *Received → Preparing → Out for Delivery → Delivered*; the app has *Preparing → Ready for pickup → Out for delivery → Delivered* | `delivery.ts:49` | §4.3.2-5 | DS-02 |
| **F-21** | P2 | Packed-meal bookings are saved with `email = ""`, so staff cannot email the customer | `CateringPacked.tsx:292` | §3.3 SMTP | CT-12 (check the DB row) |
| **F-22** | P1 | No reporting module: `/dashboard` shows charts but has no sales-value or room-utilisation summary and no export | `Dashboard.tsx` (no CSV/PDF/download code) | REQ-ADM-004 | OP-09 |
| **F-23** | P2 | Menu items have no allergen or dietary tags | No "allergen" anywhere in `src/` | REQ-DEL-001 | DO-13 |
| **F-24** | P2 | Customisation notes are per order, not per item | `DeliveryOrder.tsx:900` (single *Notes* field) | REQ-DEL-002 | DO-14 |
| **F-25** | P2 | Riders can set *Out for delivery* as well as *Delivered* | `DeliveryRider.tsx:36-44` (`NEXT_STATUS`) | §2.3 Delivery Rider | DS-13, S-18 |
| **F-26** | P2 | No audible chime and no live refresh for new delivery orders on the staff page | No audio code in `src/`; `AdminDelivery.tsx` has no polling or storage listener | §4.3.2-4, §3.1 | DS-14 |
| **F-27** | P2 | Inquiries and dashboard counts arrive by 10-second polling, not WebSocket/SSE push (bookings do use Supabase Realtime) | `setInterval` in `Operations.tsx`, `InquiryBot.tsx`, `Dashboard.tsx` | §3.4, §3.1 | IQ-05 |
| **F-28** | P2 | Booking flow differs from §4.2.2: no duration choice, status *Pending* instead of *Pending Deposit*, collision text differs from *"Already Reserved"* | `reservations.ts:7`; `CalendarModal.tsx` | §4.2.2-1, -4, -5 | FR-15 |
| **F-29** | P2 | Staff cannot flag late cancellations or no-shows | `ReservationStatus` has no such value (`reservations.ts:7`) | BR Cancellation | FR-16 |
| **F-30** | P2 | Operations stat cards differ from the SRS widgets: no *Room Occupancy*, and revenue appears only as a hint | `Operations.tsx:277-281` | §4.4.2-3 | OP-08 |
| **F-31** | P2 (docs) | The SRS architecture doesn't match the build: Python FastAPI backend vs. Express `webhook.js`; `SELECT FOR UPDATE` vs. a partial unique index for slot locking. Behaviour is equivalent; update the SRS (§2.1, §2.4, REQ-RES-002) or record a design decision | `webhook.js`; migration unique index `function_bookings_active_slot_unique` | §2.1, §2.4, REQ-RES-002 | DB-08 |

---

## 6. Run log template

| Date | Build / commit | Tester | Section | Pass | Fail | Blocked | Notes / defect IDs |
|---|---|---|---|---|---|---|---|
| | | | Smoke | | | | |
| | | | Features | | | | |
| | | | Role matrix | | | | |
| | | | DB / Security | | | | |
| | | | Non-functional | | | | |
