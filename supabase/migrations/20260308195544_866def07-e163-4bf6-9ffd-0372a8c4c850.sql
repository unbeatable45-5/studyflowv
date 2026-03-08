ALTER TABLE public.saved_outputs
  ADD COLUMN IF NOT EXISTS subject text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_title text DEFAULT NULL;

-- Allow users to update their own outputs (for rename/move)
CREATE POLICY "Users can update their own outputs"
  ON public.saved_outputs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);