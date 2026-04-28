-- Marca como urgente los perros en adopción que llevan más de 5 años esperando.
-- Corre diariamente a las 3am UTC.

SELECT cron.schedule(
  'mark-urgent-long-wait',
  '0 3 * * *',
  $$
    UPDATE public.pets
    SET adoption_status = 'urgent'
    WHERE type = 'stray'
      AND adoption_status NOT IN ('adopted', 'urgent')
      AND created_at <= now() - interval '5 years';
  $$
);
