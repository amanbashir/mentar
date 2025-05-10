-- Add any missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update RLS policies for the profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to merge data from userData to profiles
CREATE OR REPLACE FUNCTION merge_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profiles with data from userData
    UPDATE profiles
    SET 
        email = NEW.email,
        full_name = COALESCE(profiles.full_name, NEW.full_name),
        business_type = COALESCE(profiles.business_type, NEW.business_type),
        created_at = COALESCE(profiles.created_at, NEW.created_at)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create trigger if userData table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'userdata') THEN
        -- Create a trigger to sync userData changes to profiles
        CREATE OR REPLACE TRIGGER sync_user_data
            AFTER INSERT OR UPDATE ON userData
            FOR EACH ROW
            EXECUTE FUNCTION merge_user_data();

        -- Migrate existing data
        UPDATE profiles p
        SET 
            email = ud.email,
            full_name = COALESCE(p.full_name, ud.full_name),
            business_type = COALESCE(p.business_type, ud.business_type),
            created_at = COALESCE(p.created_at, ud.created_at)
        FROM userData ud
        WHERE p.id = ud.user_id;

        -- Drop the userData table after migration
        DROP TABLE IF EXISTS userData;
    END IF;
END $$; 