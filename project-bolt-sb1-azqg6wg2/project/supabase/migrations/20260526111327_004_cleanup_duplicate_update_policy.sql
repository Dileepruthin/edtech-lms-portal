/*
  # Clean up duplicate UPDATE policies

  1. Changes
    - Remove duplicate "Users can update own profile" policy
    - Keep "Users update own profile" (consistent naming with other policies)

  2. Result
    - Three clean policies using auth.uid() directly
    - No infinite recursion issues
*/

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
