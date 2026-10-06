-- Add photo_url column to incidents table
ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS photo_url text;

-- (Optional) If you haven't created the bucket yet, this SQL can also do it:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('incidents', 'incidents', true) ON CONFLICT DO NOTHING;

-- Set up policies for the incidents storage bucket (bypassed by service_role, but good for client access)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'incidents' );

CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'incidents' AND auth.role() = 'authenticated' );
