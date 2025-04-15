-- Add questionnaire columns to userData table if they don't exist
DO $$
BEGIN
    -- Check and add goalIncome column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'goalIncome') THEN
        ALTER TABLE "userData" ADD COLUMN "goalIncome" TEXT;
    END IF;

    -- Check and add resources column (JSON object with capital and time_commitment)
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'resources') THEN
        ALTER TABLE "userData" ADD COLUMN "resources" JSONB DEFAULT '{"capital": null, "time_commitment": null}'::jsonb;
    END IF;

    -- Check and add starting_point column (JSON object with capital, timeAvailable, and skills)
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'starting_point') THEN
        ALTER TABLE "userData" ADD COLUMN "starting_point" JSONB DEFAULT '{"capital": null, "timeAvailable": null, "skills": []}'::jsonb;
    END IF;

    -- Check and add interests column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'interests') THEN
        ALTER TABLE "userData" ADD COLUMN "interests" TEXT;
    END IF;

    -- Check and add hobbies column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'hobbies') THEN
        ALTER TABLE "userData" ADD COLUMN "hobbies" TEXT;
    END IF;

    -- Check and add learning_style column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'learning_style') THEN
        ALTER TABLE "userData" ADD COLUMN "learning_style" TEXT;
    END IF;

    -- Check and add vision column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'vision') THEN
        ALTER TABLE "userData" ADD COLUMN "vision" TEXT;
    END IF;

    -- Check and add business_type column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'business_type') THEN
        ALTER TABLE "userData" ADD COLUMN "business_type" TEXT;
    END IF;

    -- Check and add user_id column if it doesn't exist (this should be the primary key)
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'user_id') THEN
        ALTER TABLE "userData" ADD COLUMN "user_id" UUID REFERENCES auth.users(id);
        ALTER TABLE "userData" ADD PRIMARY KEY ("user_id");
    END IF;

    -- Check and add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'created_at') THEN
        ALTER TABLE "userData" ADD COLUMN "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;

    -- Check and add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'userData' AND column_name = 'updated_at') THEN
        ALTER TABLE "userData" ADD COLUMN "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and create it again
DROP TRIGGER IF EXISTS update_userData_timestamp ON "userData";
CREATE TRIGGER update_userData_timestamp
    BEFORE UPDATE ON "userData"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE "userData" ENABLE ROW LEVEL SECURITY;

-- Create policies for userData table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own data" ON "userData";
    DROP POLICY IF EXISTS "Users can update own data" ON "userData";
    DROP POLICY IF EXISTS "Users can insert own data" ON "userData";
    DROP POLICY IF EXISTS "Users can delete own data" ON "userData";

    -- Create new policies
    CREATE POLICY "Users can view own data"
    ON "userData"
    FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can update own data"
    ON "userData"
    FOR UPDATE
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own data"
    ON "userData"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete own data"
    ON "userData"
    FOR DELETE
    USING (auth.uid() = user_id);
END $$; 