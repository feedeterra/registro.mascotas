-- Admins pueden eliminar filas de feedback (descartar / hecho).
CREATE POLICY feedback_delete_admin
  ON public.feedback
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
