-- Impide que un usuario modifique su propia fila en profiles para escalar privilegios
-- (is_admin, shelter_id, shelter_role) vía PostgREST / supabase-js.
-- No afecta: admins actualizando cualquier fila; dueños/staff actualizando otros perfiles
-- (auth.uid() <> OLD.id); RPC SECURITY DEFINER que actualiza otras filas.

CREATE OR REPLACE FUNCTION public.profiles_prevent_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Solo restrictivo cuando el actor actualiza su PROPIA fila
  IF OLD.id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.shelter_id IS DISTINCT FROM OLD.shelter_id
     OR NEW.shelter_role IS DISTINCT FROM OLD.shelter_role THEN
    RAISE EXCEPTION 'No podés modificar rol de refugio ni permisos de administrador desde tu perfil.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_privilege_escalation ON public.profiles;

CREATE TRIGGER profiles_prevent_self_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_prevent_self_privilege_escalation();

COMMENT ON FUNCTION public.profiles_prevent_self_privilege_escalation() IS
  'Bloquea cambios en is_admin, shelter_id y shelter_role cuando auth.uid() actualiza su propia fila (no admin).';
