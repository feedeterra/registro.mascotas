-- Marca como urgente los perros en adopción que llevan más de 5 años esperando familia.
-- Usa waiting_number/waiting_unit porque created_at refleja la fecha de carga en la app,
-- no el tiempo real de espera del animal.
-- Corre diariamente a las 3am UTC.

SELECT cron.unschedule('mark-urgent-long-wait');

SELECT cron.schedule(
  'mark-urgent-long-wait',
  '0 3 * * *',
  $$
    UPDATE public.pets
    SET adoption_status = 'urgent'
    WHERE type = 'stray'
      AND adoption_status NOT IN ('adopted', 'urgent')
      AND waiting_number IS NOT NULL
      AND (
        (waiting_unit = 'años'  AND waiting_number >= 5) OR
        (waiting_unit = 'meses' AND waiting_number >= 60)
      );
  $$
);
