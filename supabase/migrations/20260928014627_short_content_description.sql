ALTER TABLE public.content ADD COLUMN IF NOT EXISTS short_description text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_short_description_length_check' AND conrelid = 'public.content'::regclass) THEN
    ALTER TABLE public.content ADD CONSTRAINT content_short_description_length_check CHECK (short_description IS NULL OR char_length(short_description) <= 300);
  END IF;
END $$;
