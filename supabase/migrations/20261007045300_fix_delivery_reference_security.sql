-- Delivery order placement fix: next_delivery_reference() runs as invoker by
-- default, so customers hit "permission denied for sequence" on the backing
-- sequence and every web order failed. Run as definer instead.
-- (Applied remotely as version 20261007045300.)

alter function public.next_delivery_reference() security definer;

revoke all on function public.next_delivery_reference() from public, anon;
grant execute on function public.next_delivery_reference() to authenticated;
