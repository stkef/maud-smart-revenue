-- Update the nudge creation policy to only allow admins
DROP POLICY IF EXISTS "Officers can create nudges" ON public.nudges;

CREATE POLICY "Admins can create nudges" 
ON public.nudges 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') AND (created_by = auth.uid()));

-- Update the nudge update policy to only allow admins
DROP POLICY IF EXISTS "Officers can update their nudges" ON public.nudges;

CREATE POLICY "Admins can update nudges" 
ON public.nudges 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));