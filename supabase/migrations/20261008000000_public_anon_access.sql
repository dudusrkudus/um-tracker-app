-- Allow anonymous (public) read access to specific tables required for public tracking page
CREATE POLICY "anon_view_events" ON public.events FOR SELECT TO anon USING (status IN ('live', 'ready'));
CREATE POLICY "anon_view_teams" ON public.teams FOR SELECT TO anon USING (true);
CREATE POLICY "anon_view_runners" ON public.runners FOR SELECT TO anon USING (true);
CREATE POLICY "anon_view_checkpoints" ON public.checkpoints FOR SELECT TO anon USING (true);
CREATE POLICY "anon_view_checkpoint_logs" ON public.checkpoint_logs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_view_incidents" ON public.incidents FOR SELECT TO anon USING (true);
