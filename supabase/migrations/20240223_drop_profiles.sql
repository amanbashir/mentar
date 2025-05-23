-- Drop policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Drop functions that might reference profiles
DROP FUNCTION IF EXISTS merge_user_data();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the profiles table
DROP TABLE IF EXISTS profiles; 