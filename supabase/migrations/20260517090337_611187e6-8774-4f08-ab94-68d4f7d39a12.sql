
drop policy "Public insert bookings" on public.bookings;
create policy "Public insert bookings" on public.bookings
  for insert with check (
    length(trim(full_name)) between 1 and 200
    and length(trim(email)) between 3 and 320
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

drop policy "Public insert contact" on public.contact_submissions;
create policy "Public insert contact" on public.contact_submissions
  for insert with check (
    length(trim(full_name)) between 1 and 200
    and length(trim(email)) between 3 and 320
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(message)) between 1 and 5000
  );
