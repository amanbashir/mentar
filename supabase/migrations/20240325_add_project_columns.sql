-- Add new columns to the projects table
ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS business_idea TEXT,
ADD COLUMN IF NOT EXISTS brief_summary TEXT,
ADD COLUMN IF NOT EXISTS total_budget DECIMAL,
ADD COLUMN IF NOT EXISTS expected_launch_date DATE,
ADD COLUMN IF NOT EXISTS income_goal DECIMAL,
ADD COLUMN IF NOT EXISTS todo_1 TEXT,
ADD COLUMN IF NOT EXISTS todo_2 TEXT,
ADD COLUMN IF NOT EXISTS todo_3 TEXT,
ADD COLUMN IF NOT EXISTS todo_4 TEXT;

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