# Implementation Plan: Timed Slots, Rescheduling & Reviewer Role

## Summary
Implement 4 major features for the appointment booking system:
1. **Timed Slots** - Convert from numbered slots to actual clock times (e.g., "9:00 AM - 9:30 AM")
2. **Rescheduling** - Allow staff and clients to reschedule appointments
3. **Reviewer Role** - New role to review/confirm appointments before booking
4. **Notifications** - SMS + Push notifications for appointment lifecycle events

---

## Phase 1: Database Schema & Types

### 1.1 Migration - Timed Slots
**File**: `database/2026-02-01_timed_slots.sql`

- [x] Create migration file
- [x] Add `slot_duration_minutes` column to departments (INTEGER DEFAULT 30)
- [x] Add `slot_start_time` column to appointments (TIME)
- [x] Add `slot_end_time` column to appointments (TIME)
- [x] Create index `idx_appointments_slot_times` on (appointment_date, slot_start_time)
- [x] Run migration on Supabase

### 1.2 Migration - Reviewer Role & Workflow
**File**: `database/2026-02-01_reviewer_role.sql`

- [x] Create migration file
- [x] Add `require_review` column to departments (BOOLEAN DEFAULT true)
- [x] Add `auto_confirm_staff_bookings` column to departments (BOOLEAN DEFAULT false)
- [x] Run migration on Supabase

### 1.3 Migration - Rescheduling
**File**: `database/2026-02-01_rescheduling.sql`

- [x] Create migration file
- [x] Add `rescheduled_from_id` column to appointments (INTEGER REFERENCES appointments)
- [x] Add `rescheduled_to_id` column to appointments (INTEGER REFERENCES appointments)
- [x] Add `reschedule_reason` column to appointments (TEXT)
- [x] Add `rescheduled_by` column to appointments (INTEGER REFERENCES users)
- [x] Run migration on Supabase

### 1.4 Migration - Notification Log
**File**: `database/2026-02-01_notification_history.sql`

- [x] Create migration file
- [x] Create `notification_log` table with columns:
  - id, appointment_id, client_id, notification_type, event_type
  - recipient_contact, status, error_message, sent_at, created_at
- [x] Run migration on Supabase

### 1.5 Type Updates

- [x] Update `lib/db-types.ts`:
  - [x] Add `slot_duration_minutes` to Department interface
  - [x] Add `require_review` to Department interface
  - [x] Add `auto_confirm_staff_bookings` to Department interface
  - [x] Add `slot_start_time` to Appointment interface
  - [x] Add `slot_end_time` to Appointment interface
  - [x] Add `rescheduled_from_id` to Appointment interface
  - [x] Add `rescheduled_to_id` to Appointment interface
  - [x] Add `reschedule_reason` to Appointment interface
  - [x] Add `"pending_review"` to appointment status union

- [x] Update `lib/types.ts`:
  - [x] Add `"reviewer"` to user role union

---

## Phase 2: Timed Slots Backend

### 2.1 Slot Time Utility
**Create**: `lib/slot-time-utils.ts`

- [x] Create new file
- [x] Implement `calculateSlotTimes(workingHours, slotNumber, durationMinutes)` → { start, end }
- [x] Implement `formatTimeDisplay(time)` → "9:00 AM"
- [x] Implement `formatSlotTimeRange(start, end)` → "9:00 AM - 9:30 AM"
- [x] Implement `generateDepartmentSlots(slotsPerDay, workingHours, duration)` → SlotInfo[]
- [ ] Add unit tests (optional)

### 2.2 Update Booking API
**Modify**: `app/api/appointments/book/route.ts`

- [x] Import slot-time-utils
- [x] Fetch department's `slot_duration_minutes` and `working_hours`
- [x] Calculate `slot_start_time` and `slot_end_time` before insert
- [x] Store calculated times in appointment record
- [x] Set initial status based on `require_review` setting:
  - If `require_review` = true AND not staff booking → "pending_review"
  - If `auto_confirm_staff_bookings` = true AND staff booking → "booked"
  - Otherwise → "pending_review"

### 2.3 Update Schedule API
**Modify**: `app/api/appointments/schedule/route.ts`

- [x] Import slot-time-utils
- [x] Fetch department's `slot_duration_minutes`
- [x] For each slot, calculate actual times using utility
- [x] Return `displayTime` (e.g., "9:00 AM - 9:30 AM") instead of "Slot 1"
- [x] Include `startTime` and `endTime` in slot object

### 2.4 Update Available Slots API
**Modify**: `app/api/appointments/available-slots/route.ts`

- [x] Import slot-time-utils
- [x] Include slot time information in each available slot
- [x] Return formatted display time

---

## Phase 3: Rescheduling

### 3.1 Reschedule API
**Create**: `app/api/appointments/reschedule/route.ts`

- [x] Create new file
- [x] Implement POST handler accepting:
  - `appointmentId` (required)
  - `newDate` (required)
  - `newSlotNumber` (required)
  - `reason` (optional)
- [x] Validate user authorization:
  - [x] Clients can only reschedule their own appointments
  - [x] Staff (admin, receptionist, reviewer) can reschedule any
- [x] Check new slot is available
- [x] Calculate new slot times
- [x] Create new appointment with `rescheduled_from_id` pointing to original
- [x] Update original appointment:
  - Set status to "rescheduled"
  - Set `rescheduled_to_id` to new appointment ID
  - Set `reschedule_reason`
- [ ] Send notifications (Phase 5)
- [x] Return success with new appointment details

### 3.2 Reschedule UI
**Create**: `components/appointments/reschedule-dialog.tsx`

- [x] Create new component file
- [x] Add date picker for new date
- [x] Fetch and display available slots for selected date
- [x] Add slots dropdown/selector
- [x] Add optional reason textarea
- [x] Implement submit with loading state
- [x] Show success/error toasts
- [x] Close dialog on success

### 3.3 Add Reschedule Button to Lists
- [x] Update `components/appointments/my-appointments-view.tsx`:
  - [x] Add Reschedule button (disabled for completed/cancelled)
  - [x] Wire up to open RescheduleDialog
- [ ] Update desktop appointments view (if separate):
  - [ ] Add Reschedule action in table row

---

## Phase 4: Reviewer Role & Workflow

### 4.1 Auth Updates
**Modify**: `lib/auth-server.ts`

- [x] Add `requireReviewerAuth()` function:
  - Returns user if role is "admin" or "reviewer"
  - Redirects to /login otherwise
- [x] Update `requireStaffAuth()` to include "reviewer" role

**Modify**: `middleware.ts`

- [x] Add "reviewer" to valid staff roles array (~line 45)

### 4.2 Review API
**Create**: `app/api/appointments/review/route.ts`

- [x] Create new file
- [x] Implement GET handler:
  - [x] Return appointments with status "pending_review"
  - [x] Optional filters: department, date range
- [x] Implement POST handler (Confirm):
  - [x] Accept `appointmentId` and optional `notes`
  - [x] Validate user is reviewer/admin
  - [x] Update status from "pending_review" to "booked"
  - [ ] Send confirmation notification (Phase 5)
- [x] Implement PUT handler (Request Reschedule):
  - [x] Accept `appointmentId` and required `reason`
  - [x] Validate user is reviewer/admin
  - [ ] Send reschedule request notification to client (Phase 5)
  - [x] Keep status as "pending_review" with reviewer notes

### 4.3 Reviewer Dashboard Page
**Create**: `app/dashboard/reviews/page.tsx`

- [x] Create new file
- [x] Server component with `requireReviewerAuth()`
- [x] Render `PendingReviewsView` client component

### 4.4 Pending Reviews Component
**Create**: `components/reviews/pending-reviews-view.tsx`

- [x] Create new file
- [x] Fetch appointments with status "pending_review"
- [x] Display as card list with:
  - Client name and phone
  - Department name
  - Date and time slot
  - Created at timestamp
- [x] Add "Confirm" button per card:
  - [x] Opens confirm dialog (optional notes)
  - [x] Calls POST /api/appointments/review
- [x] Add "Request Reschedule" button per card:
  - [x] Opens reject dialog (required reason)
  - [x] Calls PUT /api/appointments/review
- [x] Handle loading/success/error states
- [x] Add filters: department dropdown, date range

### 4.5 Navigation Update
- [x] Add "Reviews" link to sidebar (visible to reviewer/admin roles only)

### 4.6 Users Management Update
- [x] Add "Reviewer" option to role dropdown in `app/dashboard/users/page-supabase.tsx`
- [x] Update API validation in `app/api/users/route.ts`

---

## Phase 5: Notification Service

### 5.1 Push Notification Backend
**Create**: `lib/push-notification-service.ts`

- [x] Create new file
- [x] Import `web-push` library
- [x] Configure VAPID keys from environment variables
- [x] Implement `sendPushNotification(clientId, title, body, data)`:
  - [x] Query `push_subscriptions` table for client's subscriptions
  - [x] Send to all active subscriptions
  - [x] Handle 410 errors (remove expired subscriptions)
  - [x] Return results array with status per subscription
- [x] Add error handling and logging

### 5.2 Unified Notification Service
**Create**: `lib/notification-service.ts`

- [x] Create new file
- [x] Import Hubtel SMS service
- [x] Import push notification service
- [x] Implement `sendAppointmentNotification(appointmentId, eventType)`:
  - [x] Fetch appointment with client details
  - [x] Determine notification content based on eventType
  - [x] Send SMS via Hubtel
  - [x] Send push notification
  - [x] Log to `notification_log` table
- [x] Implement specific notification functions:
  - [x] `sendBookingConfirmation(appointment)`
  - [x] `sendRescheduleNotification(appointment, reason)`
  - [x] `sendReviewConfirmationNotification(appointment)`
  - [x] `sendRescheduleRequestNotification(appointment, reason)`

### 5.3 Integrate Notifications

- [x] Update `app/api/appointments/book/route.ts`:
  - [x] After successful booking with status "booked", call `sendBookingConfirmation`
- [x] Update `app/api/appointments/reschedule/route.ts`:
  - [x] After reschedule, call `sendRescheduleNotification`
- [x] Update `app/api/appointments/review/route.ts`:
  - [x] After confirmation, call `sendReviewConfirmationNotification`
  - [x] After reject, call `sendRescheduleRequestNotification`

---

## Phase 6: UI Updates

### 6.1 Display Timed Slots
**Modify**: `components/calendar/booking-modal.tsx`

- [x] Update to show formatted time range instead of "Slot X"
- [x] Calculate slot time info based on selected department

**Verify**: `components/ui/quick-booking-dialog-tanstack.tsx`

- [x] Verify it uses `slot.time` from API (should auto-work after API update)
- [x] Update TimeSlot interface to include slotNumber
- [x] Fix handleTimeSlotClick to pass slotNumber
- [x] Fix handleConfirmBooking to use slotNumber instead of parsing time string
- [x] Fix confirmCancelAppointment to use slotNumber

### 6.2 Users Management
**Modify**: `app/dashboard/users/page-supabase.tsx`

- [x] Add "Reviewer" option to role dropdown in create/edit user forms (already done)

### 6.3 Department Settings

- [x] Find or create department settings UI (`app/dashboard/departments/page-supabase.tsx`)
- [x] Add `slot_duration_minutes` number input (default 30, min 5, max 120)
- [x] Add `require_review` toggle switch
- [x] Add `auto_confirm_staff_bookings` toggle switch
- [x] Update department update API to handle new fields

---

## Environment Variables

- [ ] Generate VAPID keys: `npx web-push generate-vapid-keys`
- [ ] Add to `.env.local`:
  ```env
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
  VAPID_PRIVATE_KEY=your_private_key
  VAPID_SUBJECT=mailto:admin@yourhospital.com
  ```

---

## Testing Checklist

### Database
- [ ] All migrations run successfully
- [ ] Existing data preserved
- [ ] New columns have correct defaults
- [ ] Foreign keys work correctly

### Timed Slots
- [ ] Slot times calculate correctly for 15/30/45/60 minute durations
- [ ] Times display in 12-hour format with AM/PM
- [ ] Slots stay within department working hours
- [ ] New bookings store slot times correctly

### Rescheduling
- [ ] Client can reschedule own appointments only
- [ ] Staff can reschedule any appointment
- [ ] Original marked "rescheduled", new appointment created
- [ ] Links (rescheduled_from_id, rescheduled_to_id) set correctly
- [ ] Cannot reschedule to unavailable slot
- [ ] Notifications sent on reschedule

### Reviewer Workflow
- [ ] New client bookings start as "pending_review"
- [ ] Staff bookings auto-confirm when setting enabled
- [ ] Reviewers see pending appointments in dashboard
- [ ] Confirm changes status to "booked"
- [ ] Reject sends notification to client
- [ ] Non-reviewers cannot access review pages/APIs

### Notifications
- [ ] SMS sent for all event types via Hubtel
- [ ] Push notifications sent to subscribed devices
- [ ] Notifications logged to `notification_log` table
- [ ] Failed notifications logged with error messages
- [ ] No duplicate notifications sent

### Authorization
- [ ] Reviewer role can access review dashboard
- [ ] Reviewer role can confirm/reject appointments
- [ ] Other roles cannot access review functions
- [ ] Middleware blocks unauthorized access

---

## Progress Summary

| Phase | Status |
|-------|--------|
| Phase 1: Database & Types | ✅ Complete |
| Phase 2: Timed Slots Backend | ✅ Complete |
| Phase 3: Rescheduling | ✅ Complete (API + UI) |
| Phase 4: Reviewer Role | ✅ Complete (Auth, API, Dashboard, UI) |
| Phase 5: Notifications | ✅ Complete |
| Phase 6: UI Updates | ✅ Complete |
| Testing | ⬜ Not Started |

---

*Last Updated: 2026-02-02*
