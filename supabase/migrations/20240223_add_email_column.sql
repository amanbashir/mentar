-- Add email column to userData table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userdata' AND column_name = 'email') THEN
        ALTER TABLE "userData" ADD COLUMN email TEXT;
    END IF;
END $$; 