-- First, drop the existing foreign key constraint
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

-- Then recreate it with ON DELETE CASCADE
ALTER TABLE messages
ADD CONSTRAINT messages_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE CASCADE; 