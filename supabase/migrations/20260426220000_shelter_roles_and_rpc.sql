-- Migración para actualizar RLS y roles del personal del refugio
-- 1. Agrega el rol a profiles y migra los usuarios actuales
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shelter_role text DEFAULT 'staff' CHECK (shelter_role IN ('owner', 'staff'));

UPDATE public.profiles SET shelter_role = 'owner' WHERE shelter_id IS NOT NULL AND (shelter_role IS NULL OR shelter_role != 'owner');

-- 2. Define funciones RPC (Security Definer) para asignar/remover staff
CREATE OR REPLACE FUNCTION public.assign_shelter_staff(target_user_id uuid, target_shelter_id uuid, role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
  caller_shelter uuid;
  caller_role text;
BEGIN
  IF role NOT IN ('owner', 'staff') THEN
    RAISE EXCEPTION 'Rol inválido.';
  END IF;

  SELECT is_admin, shelter_id, shelter_role INTO caller_is_admin, caller_shelter, caller_role
  FROM public.profiles WHERE id = auth.uid();

  IF NOT (caller_is_admin OR (caller_shelter = target_shelter_id AND caller_role = 'owner')) THEN
    RAISE EXCEPTION 'No tienes permiso. Debes ser dueño del refugio o superadmin.';
  END IF;

  UPDATE public.profiles
  SET shelter_id = target_shelter_id, shelter_role = role
  WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_shelter_staff(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
  caller_shelter uuid;
  caller_role text;
  target_user_shelter uuid;
BEGIN
  SELECT is_admin, shelter_id, shelter_role INTO caller_is_admin, caller_shelter, caller_role
  FROM public.profiles WHERE id = auth.uid();

  SELECT shelter_id INTO target_user_shelter
  FROM public.profiles WHERE id = target_user_id;

  IF NOT (caller_is_admin OR (caller_shelter = target_user_shelter AND caller_role = 'owner')) THEN
    RAISE EXCEPTION 'No tienes permiso para remover personal de este refugio.';
  END IF;

  UPDATE public.profiles
  SET shelter_id = NULL, shelter_role = 'staff'
  WHERE id = target_user_id;
END;
$$;

-- 3. Actualizar políticas de shelter_config para restringirlas a 'owner'
-- Eliminamos las antiguas políticas de update/insert si existen
DROP POLICY IF EXISTS "shelter_config_staff_update" ON public.shelter_config;
DROP POLICY IF EXISTS "shelter_config_staff_insert" ON public.shelter_config;

-- Recreamos con la validación de shelter_role = 'owner'
CREATE POLICY "shelter_config_staff_update" ON public.shelter_config
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND shelter_id = shelter_config.shelter_id 
      AND shelter_role = 'owner'
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "shelter_config_staff_insert" ON public.shelter_config
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND shelter_id = shelter_config.shelter_id 
      AND shelter_role = 'owner'
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
