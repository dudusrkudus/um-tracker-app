-- Allow anonymous (public) read access to runner_locations for public dashboard tracking
CREATE POLICY "anon_view_runner_locations" ON public.runner_locations FOR SELECT TO anon USING (true);
