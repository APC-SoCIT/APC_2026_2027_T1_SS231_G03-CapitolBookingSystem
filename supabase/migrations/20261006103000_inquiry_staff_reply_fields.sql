-- Staff actions on Messenger inquiries: the webhook reply endpoint stores the
-- staff reply text and when it was sent, and the Inquiry Bot page renders both.
-- Columns are nullable: inquiries submitted before the Messenger agent and
-- website inquiries without a staff reply legitimately have null here.
alter table public.inquiries
  add column if not exists staff_reply text,
  add column if not exists replied_at timestamptz;
