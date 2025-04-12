-- Check if userData table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'userdata') THEN
        CREATE TABLE "userData" (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            email TEXT,
            first_name TEXT,
            avatar_url TEXT,
            business_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
    END IF;
END $$;

-- Add any missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'userdata' AND column_name = 'first_name') THEN
        ALTER TABLE "userData" ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'userdata' AND column_name = 'email') THEN
        ALTER TABLE "userData" ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'userdata' AND column_name = 'avatar_url') THEN
        ALTER TABLE "userData" ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'userdata' AND column_name = 'business_type') THEN
        ALTER TABLE "userData" ADD COLUMN business_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'userdata' AND column_name = 'updated_at') THEN
        ALTER TABLE "userData" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$; 