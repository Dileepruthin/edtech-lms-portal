/*
  # Clean up duplicate RLS policies and fix recursion issues

  1. Changes
    - Remove admin policies that reference profiles table (cause recursion)
    - Remove old duplicate "Users can read own profile" policy
    - Keep simple development policies using auth.uid() directly

  2. Security
    - Users can only access their own profile
    - Uses auth.uid() directly to avoid infinite recursion
*/

-- Drop old policies that could cause recursion
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Keep the new clean policies using auth.uid() directly:
-- "Users insert own profile"
-- "Users read own profile"
-- "Users update own profile"
