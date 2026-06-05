-- LoRA training models per user

CREATE TABLE IF NOT EXISTS lora_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_word text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'training',
  lora_url text,
  thumbnail_url text,
  training_images_count int,
  steps int DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  fal_request_id text,
  session_id text,
  credits_used int DEFAULT 0,
  error_message text,
  progress int DEFAULT 0,
  is_style boolean DEFAULT false
);

ALTER TABLE lora_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loras"
  ON lora_models FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS lora_models_user_idx
  ON lora_models(user_id, created_at DESC);

-- Storage bucket for training images (private; ZIP goes to fal.storage)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lora-training',
  'lora-training',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "Users upload own lora training files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lora-training'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own lora training files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lora-training'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own lora training files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lora-training'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
