-- Add avatar_url column to userData table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userdata' AND column_name = 'avatar_url') THEN
        ALTER TABLE "userData" ADD COLUMN avatar_url TEXT;
    END IF;
END $$; 