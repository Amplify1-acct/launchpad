-- Create storage bucket for AI-generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their business folder
CREATE POLICY "business_assets_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-assets' AND
    auth.role() = 'authenticated'
  );

-- Allow public read
CREATE POLICY "business_assets_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');
