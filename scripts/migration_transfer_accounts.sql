-- Add transfer_accounts column to shelter_config
-- Run this in Supabase SQL editor.

ALTER TABLE shelter_config
ADD COLUMN IF NOT EXISTS transfer_accounts jsonb DEFAULT '[]'::jsonb;

-- Optional: seed Refugio CASA initial accounts
UPDATE shelter_config
SET transfer_accounts = '[
  {
    "label": "Refugio CASA",
    "titular": "Alejandra Sarmiento",
    "dni": "21709559",
    "alias": "casarefugio2026",
    "cbu": "0070400130004005145406"
  },
  {
    "label": "Vete del Parque",
    "titular": "VETE DEL PARQUE",
    "alias": "vete.del.parque",
    "cvu": "0000003100012931965462"
  }
]'::jsonb
WHERE id = 'casa' AND (transfer_accounts IS NULL OR transfer_accounts = '[]'::jsonb);
