CREATE POLICY "delete own fursonas"
ON core.fursonas
FOR DELETE
USING (auth.uid() = user_id);