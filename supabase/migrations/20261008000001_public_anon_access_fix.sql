-- Update the events policy so anon can see all events (or at least avoid the 404 if status is different)
DROP POLICY IF EXISTS "anon_view_events" ON public.events;
CREATE POLICY "anon_view_events" ON public.events FOR SELECT TO anon USING (true);

-- Allow public access to categories (was missing previously)
DROP POLICY IF EXISTS "anon_view_categories" ON public.categories;
CREATE POLICY "anon_view_categories" ON public.categories FOR SELECT TO anon USING (true);
