-- Grant SELECT privileges to the anon role so public users can actually query these tables
GRANT SELECT ON TABLE public.events TO anon;
GRANT SELECT ON TABLE public.categories TO anon;
GRANT SELECT ON TABLE public.teams TO anon;
GRANT SELECT ON TABLE public.runners TO anon;
GRANT SELECT ON TABLE public.checkpoints TO anon;
GRANT SELECT ON TABLE public.checkpoint_logs TO anon;
GRANT SELECT ON TABLE public.incidents TO anon;
