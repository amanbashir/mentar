-- Enable RLS on userData table
ALTER TABLE "userData" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON "userData";
DROP POLICY IF EXISTS "Users can update own data" ON "userData";
DROP POLICY IF EXISTS "Users can insert own data" ON "userData";
DROP POLICY IF EXISTS "Users can delete own data" ON "userData";

-- Create policies for userData table
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

-- Grant necessary permissions
GRANT ALL ON "userData" TO authenticated;
GRANT ALL ON "userData" TO service_role; 