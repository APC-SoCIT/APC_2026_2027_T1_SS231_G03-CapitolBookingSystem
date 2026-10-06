-- Security hardening: pin the search path so the reference generator can't be
-- hijacked by odd search_path settings. SQL-only function, safe with an empty path.
alter function public.next_delivery_reference() set search_path = '';
