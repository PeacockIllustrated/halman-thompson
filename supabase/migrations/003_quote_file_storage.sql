-- Migration 003: Add file storage URL columns to quotes
-- SVG/DXF exports are now uploaded to Supabase Storage.
-- URL columns point to the stored files; raw text columns are cleared after upload.

ALTER TABLE "hal-tho_quotes"
  ADD COLUMN IF NOT EXISTS svg_workshop_url  text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS svg_production_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dxf_export_url    text DEFAULT NULL;

-- Create the storage bucket for quote fabrication exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-exports',
  'quote-exports',
  true,
  10485760, -- 10 MB
  ARRAY['image/svg+xml', 'application/dxf', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: service role can upload (via admin/API)
CREATE POLICY "Service role can upload quote exports"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'quote-exports');

-- Storage policy: anyone can read (public bucket)
CREATE POLICY "Public read access for quote exports"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'quote-exports');

-- Storage policy: service role can update/overwrite
CREATE POLICY "Service role can update quote exports"
  ON storage.objects
  FOR UPDATE
  TO service_role
  USING (bucket_id = 'quote-exports');

-- Storage policy: service role can delete
CREATE POLICY "Service role can delete quote exports"
  ON storage.objects
  FOR DELETE
  TO service_role
  USING (bucket_id = 'quote-exports');
