-- Fix: Add RLS policy for staff to read clients
-- This allows reviewers/admins/receptionists to see client data in appointments

CREATE POLICY "Staff can view clients"
ON clients
FOR SELECT
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Alternative: Allow all authenticated users to view clients
-- Uncomment if staff need access without service role:
-- CREATE POLICY "Authenticated users can view clients"
-- ON clients
-- FOR SELECT
-- TO authenticated
-- USING (true);
