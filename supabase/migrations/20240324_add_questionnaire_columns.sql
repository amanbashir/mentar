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

-- Add new columns to the existing projects table
DO $$
BEGIN
    -- Check and add business_idea column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'business_idea') THEN
        ALTER TABLE "projects" ADD COLUMN "business_idea" TEXT;
    END IF;

    -- Check and add brief_summary column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'brief_summary') THEN
        ALTER TABLE "projects" ADD COLUMN "brief_summary" TEXT;
    END IF;

    -- Check and add total_budget column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'total_budget') THEN
        ALTER TABLE "projects" ADD COLUMN "total_budget" DECIMAL;
    END IF;

    -- Check and add expected_launch_date column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'expected_launch_date') THEN
        ALTER TABLE "projects" ADD COLUMN "expected_launch_date" DATE;
    END IF;

    -- Check and add income_goal column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'income_goal') THEN
        ALTER TABLE "projects" ADD COLUMN "income_goal" DECIMAL;
    END IF;

    -- Check and add todo_1 column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'todo_1') THEN
        ALTER TABLE "projects" ADD COLUMN "todo_1" TEXT;
    END IF;

    -- Check and add todo_2 column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'todo_2') THEN
        ALTER TABLE "projects" ADD COLUMN "todo_2" TEXT;
    END IF;

    -- Check and add todo_3 column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'todo_3') THEN
        ALTER TABLE "projects" ADD COLUMN "todo_3" TEXT;
    END IF;

    -- Check and add todo_4 column
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'projects' AND column_name = 'todo_4') THEN
        ALTER TABLE "projects" ADD COLUMN "todo_4" TEXT;
    END IF;
END $$;

-- Add comments to describe the columns
COMMENT ON COLUMN "projects"."business_idea" IS 'The main business idea or concept';
COMMENT ON COLUMN "projects"."brief_summary" IS 'A brief summary of the business plan';
COMMENT ON COLUMN "projects"."total_budget" IS 'The total budget allocated for the project';
COMMENT ON COLUMN "projects"."expected_launch_date" IS 'The expected launch date of the project';
COMMENT ON COLUMN "projects"."income_goal" IS 'The target income goal for the project';
COMMENT ON COLUMN "projects"."todo_1" IS 'First todo item';
COMMENT ON COLUMN "projects"."todo_2" IS 'Second todo item';
COMMENT ON COLUMN "projects"."todo_3" IS 'Third todo item';
COMMENT ON COLUMN "projects"."todo_4" IS 'Fourth todo item';

-- Create a trigger to automatically update the updated_at column for projects if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_projects_timestamp') THEN
        CREATE TRIGGER update_projects_timestamp
            BEFORE UPDATE ON "projects"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security (RLS) for projects if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'projects' AND rowsecurity = true) THEN
        ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for projects table if they don't exist
DO $$
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view own projects') THEN
        CREATE POLICY "Users can view own projects"
        ON "projects"
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update own projects') THEN
        CREATE POLICY "Users can update own projects"
        ON "projects"
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert own projects') THEN
        CREATE POLICY "Users can insert own projects"
        ON "projects"
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete own projects') THEN
        CREATE POLICY "Users can delete own projects"
        ON "projects"
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$; 